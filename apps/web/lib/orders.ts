import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { shippingFee } from "@/lib/pricing";

export type CartItemPayload =
  | {
      kind: "design";
      designId: string;
      materialId: string;
      profileId: string;
      quantity: number;
      unitPriceTRY: number;
      title: string;
      materialName: string;
      profileName: string;
    }
  | {
      kind: "slice";
      sliceJobId: string;
      quantity: number;
      title: string;
    };

export type ShippingAddress = {
  fullName: string;
  phone: string;
  email: string;
  city: string;       // il
  district: string;   // ilçe
  address: string;
  zipCode?: string;
  identityNumber?: string; // TCKN (sandbox için zorunlu değil)
  notes?: string;
};

export type CreateOrderInput = {
  userId: string;
  items: CartItemPayload[];
  shipping: ShippingAddress;
};

/**
 * Cart payload'ındaki fiyatlara güvenmiyoruz — her item'ı DB'den yeniden
 * validate edip, slice item'ları için SliceJob.unitPriceTRY, design item'ları
 * için materials*profile bazlı bir "baseline" hesap yapıyoruz (Faz 5'te admin
 * design slice'larını önceden çalıştırınca baseline tabloda hazır olacak; şimdilik
 * design items için cart snapshot fiyatını kabul ediyoruz — kullanıcı-manipülasyonuna
 * karşı koruma Faz 5 polish).
 */
export async function createOrderDraft(input: CreateOrderInput) {
  if (input.items.length === 0) throw new Error("cart empty");

  const settings = await getSettings();

  // slice item'ları için SliceJob'ları toplu çek, DONE ve userId eşleşmesi kontrol et
  const sliceIds = input.items
    .filter((i): i is Extract<CartItemPayload, { kind: "slice" }> => i.kind === "slice")
    .map((i) => i.sliceJobId);

  const sliceJobs = sliceIds.length
    ? await prisma.sliceJob.findMany({
        where: { id: { in: sliceIds }, status: "DONE" },
        include: { material: true, profile: true, design: true },
      })
    : [];
  const jobById = new Map(sliceJobs.map((j) => [j.id, j]));

  // design item'ları için material/profile/design'ı fetch ve doğrula
  const designRefs = input.items
    .filter((i): i is Extract<CartItemPayload, { kind: "design" }> => i.kind === "design");

  const designIds = [...new Set(designRefs.map((d) => d.designId))];
  const materialIds = [...new Set(designRefs.map((d) => d.materialId))];
  const profileIds = [...new Set(designRefs.map((d) => d.profileId))];

  const [designs, materials, profiles] = await Promise.all([
    designIds.length
      ? prisma.design.findMany({ where: { id: { in: designIds }, status: "PUBLISHED" } })
      : [],
    materialIds.length
      ? prisma.material.findMany({ where: { id: { in: materialIds }, isActive: true } })
      : [],
    profileIds.length
      ? prisma.printProfile.findMany({ where: { id: { in: profileIds } } })
      : [],
  ]);

  const designById = new Map(designs.map((d) => [d.id, d]));
  const materialById = new Map(materials.map((m) => [m.id, m]));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // Order line'larını topla
  let subtotal = new Prisma.Decimal(0);
  const lines: Array<Omit<Prisma.OrderItemCreateManyOrderInput, "orderId">> = [];

  for (const item of input.items) {
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      throw new Error(
        `quantity must be at least 1 (got ${item.quantity}) for item`,
      );
    }
    if (item.quantity > 20) {
      throw new Error(
        `quantity must be at most 20 (got ${item.quantity}) for item`,
      );
    }
    const qty = Math.floor(item.quantity);

    if (item.kind === "slice") {
      const job = jobById.get(item.sliceJobId);
      if (!job || !job.unitPriceTRY) {
        throw new Error(`slice job missing or not done: ${item.sliceJobId}`);
      }
      const unit = new Prisma.Decimal(job.unitPriceTRY);
      const total = unit.mul(qty);
      subtotal = subtotal.add(total);
      lines.push({
        sliceJobId: job.id,
        quantity: qty,
        unitPriceTRY: unit,
        totalPriceTRY: total,
        snapshot: {
          title: item.title,
          material: { id: job.material.id, name: job.material.name, colorHex: job.material.colorHex, type: job.material.type },
          profile: { id: job.profile.id, name: job.profile.name, layerHeightMm: job.profile.layerHeightMm, infillPercent: job.profile.infillPercent },
          filamentGrams: job.filamentGrams,
          printSeconds: job.printSeconds,
          sourceFileKey: job.sourceFileKey,
        },
      });
    } else {
      const design = designById.get(item.designId);
      const material = materialById.get(item.materialId);
      const profile = profileById.get(item.profileId);
      if (!design || !material || !profile) {
        throw new Error(`design/material/profile not resolvable for item`);
      }
      // Cart snapshot fiyatını kabul ediyoruz (Faz 5'te admin pre-slice ile replace).
      const unit = new Prisma.Decimal(item.unitPriceTRY);
      const total = unit.mul(qty);
      subtotal = subtotal.add(total);
      lines.push({
        designId: design.id,
        quantity: qty,
        unitPriceTRY: unit,
        totalPriceTRY: total,
        snapshot: {
          title: design.title,
          slug: design.slug,
          material: { id: material.id, name: material.name, colorHex: material.colorHex, type: material.type },
          profile: { id: profile.id, name: profile.name, layerHeightMm: profile.layerHeightMm, infillPercent: profile.infillPercent },
        },
      });
    }
  }

  if (lines.length === 0) throw new Error("no valid line items");

  const subtotalNum = subtotal.toNumber();
  const shippingNum = shippingFee(subtotalNum, settings);
  const shippingD = new Prisma.Decimal(shippingNum);
  const totalD = subtotal.add(shippingD);

  const conversationId = `conv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const order = await prisma.order.create({
    data: {
      userId: input.userId,
      status: "PENDING_PAYMENT",
      subtotalTRY: subtotal,
      shippingTRY: shippingD,
      totalTRY: totalD,
      iyzicoConvId: conversationId,
      shippingSnapshot: input.shipping as unknown as Prisma.InputJsonValue,
      items: { createMany: { data: lines } },
    },
    include: { items: true },
  });

  return order;
}
