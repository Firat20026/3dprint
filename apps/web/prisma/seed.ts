import { PrismaClient, MaterialType, Role, DesignStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { DEFAULT_SETTINGS } from "../lib/settings";

const prisma = new PrismaClient();

async function main() {
  const adminEmail =
    process.env.ADMIN_BOOTSTRAP_EMAIL ?? "admin@frint3d.local";
  const adminPassword =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ?? "changeme123";

  console.log(`▸ Bootstrap admin: ${adminEmail}`);
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, passwordHash },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: Role.ADMIN,
    },
  });

  console.log("▸ Print profiles");
  const profiles = [
    {
      name: "Hızlı",
      layerHeightMm: 0.28,
      infillPercent: 10,
      speedMmPerS: 220,
      sortOrder: 1,
    },
    {
      name: "Standart",
      layerHeightMm: 0.2,
      infillPercent: 15,
      speedMmPerS: 180,
      isDefault: true,
      sortOrder: 2,
    },
    {
      name: "Yüksek",
      layerHeightMm: 0.12,
      infillPercent: 20,
      speedMmPerS: 140,
      sortOrder: 3,
    },
    {
      name: "Ultra",
      layerHeightMm: 0.08,
      infillPercent: 25,
      speedMmPerS: 100,
      sortOrder: 4,
    },
  ];
  for (const p of profiles) {
    await prisma.printProfile.upsert({
      where: { id: `profile-${p.name.toLowerCase()}` },
      update: { ...p },
      create: { id: `profile-${p.name.toLowerCase()}`, ...p },
    });
  }

  console.log("▸ Materials (Snapmaker U1 stock)");
  const materials = [
    {
      id: "mat-pla-white",
      name: "PLA Beyaz",
      type: MaterialType.PLA,
      colorHex: "#f5f5f7",
      densityGcm3: 1.24,
      stockGrams: 1000,
      pricePerGramTRY: 2.5,
    },
    {
      id: "mat-pla-black",
      name: "PLA Mat Siyah",
      type: MaterialType.PLA,
      colorHex: "#0a0a0a",
      densityGcm3: 1.24,
      stockGrams: 1500,
      pricePerGramTRY: 2.5,
    },
    {
      id: "mat-pla-blue",
      name: "PLA Mavi",
      type: MaterialType.PLA,
      colorHex: "#3b82f6",
      densityGcm3: 1.24,
      stockGrams: 800,
      pricePerGramTRY: 2.5,
    },
    {
      id: "mat-pla-red",
      name: "PLA Kırmızı",
      type: MaterialType.PLA,
      colorHex: "#ef4444",
      densityGcm3: 1.24,
      stockGrams: 500,
      pricePerGramTRY: 2.5,
    },
    {
      id: "mat-petg-clear",
      name: "PETG Şeffaf",
      type: MaterialType.PETG,
      colorHex: "#cbd5e1",
      densityGcm3: 1.27,
      stockGrams: 600,
      pricePerGramTRY: 3.2,
    },
    {
      id: "mat-tpu-black",
      name: "TPU Esnek Siyah",
      type: MaterialType.TPU,
      colorHex: "#1f1f1f",
      densityGcm3: 1.21,
      stockGrams: 300,
      pricePerGramTRY: 4.5,
    },
  ];
  for (const m of materials) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: m,
      create: m,
    });
  }

  console.log("▸ Credit packs");
  const packs = [
    {
      id: "pack-starter",
      name: "Başlangıç",
      credits: 100,
      priceTRY: 99,
      badge: null,
      sortOrder: 1,
    },
    {
      id: "pack-pro",
      name: "Pro",
      credits: 500,
      priceTRY: 399,
      badge: "Popüler",
      sortOrder: 2,
    },
    {
      id: "pack-ultra",
      name: "Ultra",
      credits: 2000,
      priceTRY: 1299,
      badge: "En İyi Değer",
      sortOrder: 3,
    },
  ];
  for (const p of packs) {
    await prisma.creditPack.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  console.log("▸ Demo designs");
  const sampleStlPath = path.resolve(
    process.cwd(),
    "../../samples/cube_20mm.stl",
  );
  let cubeBuffer: Buffer | null = null;
  try {
    cubeBuffer = await readFile(sampleStlPath);
  } catch {
    console.log("  ! sample STL bulunamadı, demo tasarımlar atlanıyor");
  }

  if (cubeBuffer) {
    const uploadDir = path.resolve(
      process.cwd(),
      process.env.UPLOAD_DIR ?? "./data/uploads",
    );
    const designsDir = path.join(uploadDir, "designs");
    await mkdir(designsDir, { recursive: true });

    const demos = [
      {
        id: "demo-cube",
        slug: "test-kupu-20mm",
        title: "Test Küpü 20mm",
        description:
          "Kalibrasyon ve örnek baskı için klasik 20mm küp. Hızlı teslimat, her materyal.",
        category: "Kalibrasyon",
      },
      {
        id: "demo-cube-2",
        slug: "mini-organizer",
        title: "Mini Organizatör",
        description:
          "Masaüstü kablo ve kalem düzenleyici. 100% geri dönüşümlü PLA öneririz.",
        category: "Organizasyon",
      },
    ];

    for (const d of demos) {
      const existing = await prisma.design.findUnique({
        where: { id: d.id },
      });
      if (existing) continue;
      const id = randomUUID();
      const key = `designs/${id}.stl`;
      await writeFile(path.join(uploadDir, key), cubeBuffer);
      const fileHash = createHash("sha256").update(cubeBuffer).digest("hex");
      await prisma.design.create({
        data: {
          id: d.id,
          slug: d.slug,
          title: d.title,
          description: d.description,
          category: d.category,
          modelFileKey: key,
          fileFormat: "stl",
          status: DesignStatus.PUBLISHED,
          source: "ADMIN",
          defaultProfileId: "profile-standart",
          tagsJson: ["demo", "sample"],
        },
      });
      console.log(`  + ${d.title} (${fileHash.slice(0, 8)})`);
    }
  }

  console.log("▸ Default settings");
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }

  console.log("✓ Seed done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
