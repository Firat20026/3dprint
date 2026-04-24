/**
 * Lightweight tests for the pricing engine. Run with `tsx pricing.test.ts`
 * (no test runner dependency yet — vitest will be added in Faz 2).
 */
import { calculatePrice, shippingFee, lineTotal } from "./pricing";

const settings = {
  machineCostPerHourTRY: 30,
  setupFeeTRY: 15,
  marginPercent: 40,
  shippingFlatTRY: 80,
  freeShippingThresholdTRY: 500,
};

function assertEq(label: string, got: number, want: number) {
  const ok = Math.abs(got - want) < 0.011;
  console.log(`${ok ? "✓" : "✗"} ${label}  got=${got} want=${want}`);
  if (!ok) process.exitCode = 1;
}

// 35g PLA @ 2.5/g, 2h36m25s (=9385s) print
const r1 = calculatePrice({
  filamentGrams: 35,
  printSeconds: 9385,
  pricePerGramTRY: 2.5,
  settings,
});
assertEq("material cost",  r1.materialCostTRY, 87.5);
assertEq("time cost",      r1.timeCostTRY, 78.21);
assertEq("setup",          r1.setupFeeTRY, 15);
assertEq("subtotal",       r1.subtotalTRY, 180.71);
assertEq("unit (40%)",     r1.unitPriceTRY, 252.99);

// Quantity
assertEq("line ×3", lineTotal(252.99, 3), 758.97);

// Shipping under threshold
assertEq("ship under",  shippingFee(300, settings), 80);
assertEq("ship over",   shippingFee(750, settings), 0);
assertEq("ship at",     shippingFee(500, settings), 0);

// 0 grams 0 seconds (e.g. corrupt slice)
const z = calculatePrice({
  filamentGrams: 0,
  printSeconds: 0,
  pricePerGramTRY: 2.5,
  settings,
});
assertEq("zero unit (only setup * 1.4)", z.unitPriceTRY, 21);
