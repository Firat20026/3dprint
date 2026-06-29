"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function parseImages(raw: string): { imageUrl: string | null; extra: string[] } {
  const urls = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { imageUrl: urls[0] ?? null, extra: urls.slice(1) };
}

function dec(value: FormDataEntryValue | null): Prisma.Decimal | null {
  const s = String(value ?? "").trim().replace(",", ".");
  if (!s) return null;
  const n = parseFloat(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return new Prisma.Decimal(n.toFixed(2));
}

type ProductInput = {
  title: string;
  description: string | null;
  priceTRY: Prisma.Decimal;
  oldPriceTRY: Prisma.Decimal | null;
  imageUrl: string | null;
  imagesJson: string[];
  category: string | null;
  buyUrl: string;
  inStock: boolean;
  featured: boolean;
  isActive: boolean;
  sortOrder: number;
};

function readForm(formData: FormData): ProductInput {
  const title = String(formData.get("title") ?? "").trim();
  const buyUrl = String(formData.get("buyUrl") ?? "").trim();
  const priceTRY = dec(formData.get("priceTRY"));

  if (!title) throw new Error("Ürün başlığı gerekli");
  if (!priceTRY || priceTRY.lte(0)) throw new Error("Fiyat 0'dan büyük olmalı");
  if (!buyUrl || !/^https?:\/\//i.test(buyUrl)) {
    throw new Error("Geçerli bir Shopier linki gerekli (https:// ile başlamalı)");
  }

  const { imageUrl, extra } = parseImages(String(formData.get("images") ?? ""));
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  return {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    priceTRY,
    oldPriceTRY: dec(formData.get("oldPriceTRY")),
    imageUrl,
    imagesJson: extra,
    category: String(formData.get("category") ?? "").trim() || null,
    buyUrl,
    inStock: formData.get("inStock") === "on",
    featured: formData.get("featured") === "on",
    isActive: formData.get("isActive") === "on",
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

function revalidateAll() {
  revalidatePath("/admin/products");
  revalidatePath("/designs");
  revalidatePath("/");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const input = readForm(formData);
  await prisma.catalogProduct.create({
    data: { ...input, imagesJson: input.imagesJson },
  });
  revalidateAll();
}

export async function updateProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");
  const input = readForm(formData);
  await prisma.catalogProduct.update({
    where: { id },
    data: { ...input, imagesJson: input.imagesJson },
  });
  revalidateAll();
  redirect("/admin/products");
}

export async function toggleProductActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = formData.get("current") === "true";
  await prisma.catalogProduct.update({
    where: { id },
    data: { isActive: !current },
  });
  revalidateAll();
}

export async function toggleProductFeatured(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = formData.get("current") === "true";
  await prisma.catalogProduct.update({
    where: { id },
    data: { featured: !current },
  });
  revalidateAll();
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");
  await prisma.catalogProduct.delete({ where: { id } });
  revalidateAll();
}
