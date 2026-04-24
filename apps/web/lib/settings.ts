import { prisma } from "@/lib/db";

/**
 * Strongly-typed app settings stored as key/value rows in the Settings table.
 * Admin can edit these from /admin/settings. Read via getSettings().
 */
export type AppSettings = {
  machineCostPerHourTRY: number;
  setupFeeTRY: number;
  marginPercent: number;
  shippingFlatTRY: number;
  freeShippingThresholdTRY: number;
  meshyTextCost: number;
  meshyImageCost: number;
  marketplaceCommissionPercent: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  machineCostPerHourTRY: 30,
  setupFeeTRY: 15,
  marginPercent: 40,
  shippingFlatTRY: 80,
  freeShippingThresholdTRY: 500,
  meshyTextCost: 10,
  meshyImageCost: 25,
  marketplaceCommissionPercent: 20,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.settings.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<
    string,
    unknown
  >;
  return {
    ...DEFAULT_SETTINGS,
    ...(map as Partial<AppSettings>),
  };
}

export async function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
) {
  await prisma.settings.upsert({
    where: { key },
    create: { key, value: value as never },
    update: { value: value as never },
  });
}
