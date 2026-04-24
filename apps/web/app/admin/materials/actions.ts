"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import type { MaterialType } from "@prisma/client";

export async function createMaterial(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "PLA") as MaterialType;
  const colorHex = String(formData.get("colorHex") ?? "#ffffff").trim();
  const densityGcm3 = parseFloat(String(formData.get("densityGcm3") ?? "1.24"));
  const diameterMm = parseFloat(String(formData.get("diameterMm") ?? "1.75"));
  const stockGrams = parseFloat(String(formData.get("stockGrams") ?? "0"));
  const pricePerGramTRY = parseFloat(String(formData.get("pricePerGramTRY") ?? "0"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) throw new Error("Materyal ismi gerekli");
  if (pricePerGramTRY <= 0) throw new Error("Gram fiyatı 0'dan büyük olmalı");

  await prisma.material.create({
    data: { name, type, colorHex, densityGcm3, diameterMm, stockGrams, pricePerGramTRY, notes, isActive: true },
  });
  revalidatePath("/admin/materials");
  revalidatePath("/pricing");
}

export async function updateMaterial(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "PLA") as MaterialType;
  const colorHex = String(formData.get("colorHex") ?? "#ffffff").trim();
  const densityGcm3 = parseFloat(String(formData.get("densityGcm3") ?? "1.24"));
  const diameterMm = parseFloat(String(formData.get("diameterMm") ?? "1.75"));
  const stockGrams = parseFloat(String(formData.get("stockGrams") ?? "0"));
  const pricePerGramTRY = parseFloat(String(formData.get("pricePerGramTRY") ?? "0"));
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name) throw new Error("Materyal ismi gerekli");

  await prisma.material.update({
    where: { id },
    data: { name, type, colorHex, densityGcm3, diameterMm, stockGrams, pricePerGramTRY, notes },
  });
  revalidatePath("/admin/materials");
  revalidatePath("/pricing");
}

export async function toggleMaterialActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = formData.get("current") === "true";
  await prisma.material.update({ where: { id }, data: { isActive: !current } });
  revalidatePath("/admin/materials");
}

export async function deleteMaterial(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");

  // Referans kontrolü — ilişkili slice job varsa silme, pasife al
  const refs = await prisma.material.findUnique({
    where: { id },
    select: { _count: { select: { sliceJobs: true, cartItems: true } } },
  });
  const total = (refs?._count.sliceJobs ?? 0) + (refs?._count.cartItems ?? 0);
  if (total > 0) {
    // Silmek yerine pasife al
    await prisma.material.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/materials");
    return { soft: true, message: `Bu materyal ${total} slice/sipariş kaydında kullanılıyor; silinmek yerine pasife alındı.` };
  }

  await prisma.material.delete({ where: { id } });
  revalidatePath("/admin/materials");
  return { soft: false };
}
