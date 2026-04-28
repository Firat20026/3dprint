import { prisma } from "@/lib/db";
import type {
  Design,
  Material,
  PrintProfile,
  Prisma,
  DesignSource,
} from "@prisma/client";

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

export type DesignSearchFilters = {
  q?: string; // free-text title/description search
  category?: string | null;
  source?: DesignSource | null; // ADMIN | USER_MARKETPLACE | MESHY
  multiPlate?: boolean; // plateCount > 1
  multiMaterial?: boolean; // materialGroups length > 1 (Postgres jsonb_array_length)
  sort?: "newest" | "oldest" | "alpha";
};

/**
 * Server-side search across PUBLISHED designs. Substring match on title +
 * description (case-insensitive), Postgres-side filtering on category /
 * source / plateCount. Multi-material is computed via jsonb_array_length;
 * Prisma can't express it cleanly through findMany, so we filter
 * post-fetch — fine because the catalog never holds tens of thousands of
 * rows in memory.
 */
export async function searchPublishedDesigns(filters: DesignSearchFilters) {
  const where: Prisma.DesignWhereInput = {
    status: "PUBLISHED",
  };

  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ];
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.source) {
    where.source = filters.source;
  }
  if (filters.multiPlate) {
    where.plateCount = { gt: 1 };
  }

  const orderBy: Prisma.DesignOrderByWithRelationInput =
    filters.sort === "oldest"
      ? { createdAt: "asc" }
      : filters.sort === "alpha"
        ? { title: "asc" }
        : { createdAt: "desc" };

  let designs = await prisma.design.findMany({
    where,
    orderBy,
    include: { defaultProfile: true },
  });

  if (filters.multiMaterial) {
    designs = designs.filter((d) => {
      const groups = d.materialGroups as unknown as Array<unknown>;
      return Array.isArray(groups) && groups.length > 1;
    });
  }

  return designs;
}

/** All distinct PUBLISHED-design categories — used to populate the filter
 *  dropdown without forcing the page to load the full catalog twice. */
export async function listPublishedDesignCategories() {
  const rows = await prisma.design.findMany({
    where: { status: "PUBLISHED", category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category).filter((c): c is string => !!c);
}

export async function getDesignBySlug(slug: string) {
  return prisma.design.findUnique({
    where: { slug },
    include: {
      defaultProfile: true,
      uploader: {
        select: { id: true, name: true, image: true },
      },
    },
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
