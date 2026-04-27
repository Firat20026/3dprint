"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Cart item — iki tür:
 *   kind="design" → önceden admin yüklenmiş katalog tasarımı
 *   kind="slice"  → kullanıcı STL'i, slice sonucu (SliceJob) referansıyla
 *
 * unitPriceTRY cart'a atıldığı anda snapshot'lanır. Gerçek çekim checkout'ta
 * re-validate edilecek (Faz 3).
 */
export type DesignCartItem = {
  id: string;
  kind: "design";
  designId: string;
  designSlug: string;
  title: string;
  thumbnailUrl: string | null;
  materialId: string;
  materialName: string;
  materialColorHex: string;
  profileId: string;
  profileName: string;
  quantity: number;
  unitPriceTRY: number;
  /**
   * 1-based plate index for multi-plate 3MF designs. Single-plate items leave
   * this as 1. When a user adds plate 2 of the same design with a different
   * material, it's a separate cart line (different id, different price).
   */
  plateIndex?: number;
};

export type SliceCartItem = {
  id: string;
  kind: "slice";
  sliceJobId: string;
  title: string;           // dosya adı veya kullanıcı girişi
  thumbnailUrl: null;
  materialId: string;
  materialName: string;
  materialColorHex: string;
  profileId: string;
  profileName: string;
  filamentGrams: number;
  printSeconds: number;
  quantity: number;
  unitPriceTRY: number;
};

export type CartItem = DesignCartItem | SliceCartItem;

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<DesignCartItem, "id"> | Omit<SliceCartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotalTRY: () => number;
};

type CartItemInput = Omit<DesignCartItem, "id"> | Omit<SliceCartItem, "id">;

function itemId(item: CartItemInput): string {
  if (item.kind === "design") {
    const plate = item.plateIndex ?? 1;
    return `d:${item.designId}:${item.materialId}:${item.profileId}:p${plate}`;
  }
  return `s:${item.sliceJobId}`;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const id = itemId(item);
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, id } as CartItem] };
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) =>
                  i.id === id ? { ...i, quantity } : i,
                ),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotalTRY: () =>
        get().items.reduce((sum, i) => sum + i.unitPriceTRY * i.quantity, 0),
    }),
    {
      name: "frint3d-cart",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted, version) => {
        // v1 → v2: id formatı değişti (prefix'li). Eski item'ları drop.
        // v2 → v3: design id includes plateIndex; old design lines need
        //          rehashing. Easiest is to drop and let the user re-add.
        if (version < 3) return { items: [] };
        return persisted as { items: CartItem[] };
      },
    },
  ),
);
