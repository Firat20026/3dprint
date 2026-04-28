import type { AppSettings } from "@/lib/settings";

/**
 * Pre-slice estimate for a CATALOG design.
 *
 * Used in two places that MUST agree:
 *   - Client-side preview (AddToCartForm) — shows "Tahmini fiyat" before
 *     a real slice job exists.
 *   - Server-side validation (createOrderDraft) — recomputes from fresh
 *     material/settings/design, ignoring whatever number the client put in
 *     the cart payload. The client number is treated as a hint, not truth.
 *
 * Until per-design pre-slicing lands, we use a flat 40g placeholder and a
 * single setup fee. Design.basePriceMarkupPercent stacks on top for
 * marketplace items (the designer's cut). Platform margin from settings
 * applies to everything.
 */
export const DESIGN_ESTIMATE_GRAMS = 40;

export type DesignPriceInputs = {
  pricePerGramTRY: number;
  designerMarkupPercent: number; // Design.basePriceMarkupPercent (0 for ADMIN)
  settings: Pick<AppSettings, "marginPercent" | "setupFeeTRY">;
};

export function estimateDesignUnitPrice(input: DesignPriceInputs): number {
  const materialCost = DESIGN_ESTIMATE_GRAMS * input.pricePerGramTRY;
  const subtotal = materialCost + input.settings.setupFeeTRY;
  const platform = subtotal * (input.settings.marginPercent / 100);
  const designer = subtotal * (input.designerMarkupPercent / 100);
  return round2(subtotal + platform + designer);
}

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
