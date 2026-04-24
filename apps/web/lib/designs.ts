import { prisma } from "@/lib/db";
import type { Design, Material, PrintProfile } from "@prisma/client";

export type DesignWithDefaults = Design & {
  defaultProfile: PrintProfile | null;
};

export async function listPublishedDesigns() {
  return prisma.design.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { defaultProfile: true },
  });
}

export async function getDesignBySlug(slug: string) {
  return prisma.design.findUnique({
    where: { slug },
    include: { defaultProfile: true },
  });
}

export async function listMaterialsInStock(): Promise<Material[]> {
  return prisma.material.findMany({
    where: { isActive: true, stockGrams: { gt: 0 } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function listActiveProfiles(): Promise<PrintProfile[]> {
  return prisma.printProfile.findMany({
    orderBy: { sortOrder: "asc" },
  });
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}
