/**
 * Pricing engine — mirror of apps/web/lib/pricing.ts.
 * Kept in sync manually; if this drifts, a shared package is the fix (Faz 5 polish).
 */
export type PriceSettings = {
  machineCostPerHourTRY: number;
  setupFeeTRY: number;
  marginPercent: number;
};

export type PriceBreakdown = {
  materialCostTRY: number;
  timeCostTRY: number;
  setupFeeTRY: number;
  subtotalTRY: number;
  marginTRY: number;
  unitPriceTRY: number;
};

export function calculatePrice(input: {
  filamentGrams: number;
  printSeconds: number;
  pricePerGramTRY: number;
  settings: PriceSettings;
}): PriceBreakdown {
  const { filamentGrams, printSeconds, pricePerGramTRY, settings } = input;
  const materialCostTRY = round2(filamentGrams * pricePerGramTRY);
  const timeCostTRY = round2(
    (printSeconds / 3600) * settings.machineCostPerHourTRY,
  );
  const setupFeeTRY = round2(settings.setupFeeTRY);
  const subtotalTRY = round2(materialCostTRY + timeCostTRY + setupFeeTRY);
  const unitPriceTRY = round2(
    subtotalTRY * (1 + settings.marginPercent / 100),
  );
  const marginTRY = round2(unitPriceTRY - subtotalTRY);
  return { materialCostTRY, timeCostTRY, setupFeeTRY, subtotalTRY, marginTRY, unitPriceTRY };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
