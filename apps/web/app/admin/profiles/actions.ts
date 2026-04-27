"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function parseCommonFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const layerHeightMm = parseFloat(
    String(formData.get("layerHeightMm") ?? "0.20"),
  );
  const infillPercent = parseInt(String(formData.get("infillPercent") ?? "15"), 10);
  const speedMmPerS = parseInt(String(formData.get("speedMmPerS") ?? "180"), 10);
  const supportsEnabled = formData.get("supportsEnabled") === "on";
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  if (!name || name.length > 60) throw new Error("İsim 1–60 karakter olmalı");
  if (!Number.isFinite(layerHeightMm) || layerHeightMm < 0.05 || layerHeightMm > 1) {
    throw new Error("Layer height 0.05–1.00 mm arasında olmalı");
  }
  if (!Number.isFinite(infillPercent) || infillPercent < 0 || infillPercent > 100) {
    throw new Error("Infill % 0–100 arasında olmalı");
  }
  if (!Number.isFinite(speedMmPerS) || speedMmPerS < 10 || speedMmPerS > 500) {
    throw new Error("Hız 10–500 mm/s arasında olmalı");
  }

  return {
    name,
    layerHeightMm,
    infillPercent,
    speedMmPerS,
    supportsEnabled,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

export async function createProfile(formData: FormData) {
  await requireAdmin();
  const data = parseCommonFields(formData);
  const isDefault = formData.get("isDefault") === "on";

  // Only one default at a time. If marking new as default, unset others.
  if (isDefault) {
    await prisma.printProfile.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }
  await prisma.printProfile.create({
    data: { ...data, isDefault, isActive: true },
  });
  revalidatePath("/admin/profiles");
  revalidatePath("/pricing");
}

export async function updateProfile(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");
  const data = parseCommonFields(formData);
  const isDefault = formData.get("isDefault") === "on";

  if (isDefault) {
    await prisma.printProfile.updateMany({
      where: { isDefault: true, NOT: { id } },
      data: { isDefault: false },
    });
  }
  await prisma.printProfile.update({
    where: { id },
    data: { ...data, isDefault },
  });
  revalidatePath("/admin/profiles");
  revalidatePath("/pricing");
}

export async function toggleProfileActive(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = formData.get("current") === "true";
  await prisma.printProfile.update({
    where: { id },
    data: { isActive: !current },
  });
  revalidatePath("/admin/profiles");
}

export async function deleteProfile(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id gerekli");

  const refs = await prisma.printProfile.findUnique({
    where: { id },
    select: {
      _count: { select: { sliceJobs: true, cartItems: true, designs: true } },
    },
  });
  const total =
    (refs?._count.sliceJobs ?? 0) +
    (refs?._count.cartItems ?? 0) +
    (refs?._count.designs ?? 0);

  if (total > 0) {
    // Soft delete: there are existing slice/cart/design references — flipping
    // isActive=false hides it from selectors without breaking historical data.
    await prisma.printProfile.update({
      where: { id },
      data: { isActive: false },
    });
  } else {
    await prisma.printProfile.delete({ where: { id } });
  }
  revalidatePath("/admin/profiles");
}
