import type { AppSettings } from "@/lib/settings";

export type PriceInputs = {
  filamentGrams: number;
  printSeconds: number;
  pricePerGramTRY: number;
  settings: Pick<
    AppSettings,
    "machineCostPerHourTRY" | "setupFeeTRY" | "marginPercent"
  >;
};

export type PriceBreakdown = {
  materialCostTRY: number;
  timeCostTRY: number;
  setupFeeTRY: number;
  subtotalTRY: number;
  marginTRY: number;
  unitPriceTRY: number;
};

/**
 * Pure pricing function. Easily unit-testable.
 * unitPrice = (materialCost + timeCost + setupFee) * (1 + margin%)
 */
export function calculatePrice(input: PriceInputs): PriceBreakdown {
  const { filamentGrams, printSeconds, pricePerGramTRY, settings } = input;

  const materialCostTRY = round2(filamentGrams * pricePerGramTRY);
  const timeCostTRY = round2(
    (printSeconds / 3600) * settings.machineCostPerHourTRY
  );
  const setupFeeTRY = round2(settings.setupFeeTRY);
  const subtotalTRY = round2(materialCostTRY + timeCostTRY + setupFeeTRY);
  const unitPriceTRY = round2(subtotalTRY * (1 + settings.marginPercent / 100));
  const marginTRY = round2(unitPriceTRY - subtotalTRY);

  return {
    materialCostTRY,
    timeCostTRY,
    setupFeeTRY,
    subtotalTRY,
    marginTRY,
    unitPriceTRY,
  };
}

/**
 * Apply quantity to a unit price. Defensive against bad input.
 */
export function lineTotal(unitPriceTRY: number, quantity: number) {
  return round2(unitPriceTRY * Math.max(1, Math.floor(quantity)));
}

/**
 * Compute shipping based on cart subtotal + flat config.
 */
export function shippingFee(
  subtotalTRY: number,
  settings: Pick<AppSettings, "shippingFlatTRY" | "freeShippingThresholdTRY">
) {
  if (subtotalTRY >= settings.freeShippingThresholdTRY) return 0;
  return round2(settings.shippingFlatTRY);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
