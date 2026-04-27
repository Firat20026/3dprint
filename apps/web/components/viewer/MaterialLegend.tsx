"use client";

/**
 * MaterialLegend — sidebar widget that lists per-extruder materials parsed
 * from a 3MF. Clicking a row toggles its visibility in the viewer (the
 * parent owns the selection state).
 *
 * Renders a compact stacked layout. If the design has only one material
 * the parent should hide this entirely (single-color models don't need a
 * legend).
 */
import type { DetectedMaterial } from "./ModelViewer";

export type MaterialLegendProps = {
  materials: DetectedMaterial[];
  visible: Set<number> | null;
  onToggle: (index: number) => void;
};

export function MaterialLegend({
  materials,
  visible,
  onToggle,
}: MaterialLegendProps) {
  if (materials.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="eyebrow">Materyaller</p>
      <ul className="mt-3 space-y-1.5">
        {materials.map((m) => {
          const isVisible = visible === null || visible.has(m.index);
          return (
            <li key={`${m.name}:${m.colorHex}`}>
              <button
                type="button"
                onClick={() => onToggle(m.index)}
                className={
                  "flex w-full items-center justify-between gap-2 rounded-[var(--radius-button)] border px-2.5 py-1.5 text-left text-xs transition-colors " +
                  (isVisible
                    ? "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-brand)]/40"
                    : "border-transparent text-[var(--color-text-subtle)] line-through opacity-60 hover:opacity-100")
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: m.colorHex }}
                  />
                  <span className="font-medium text-[var(--color-text)]">
                    {m.name}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                  E{m.extruderId}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
