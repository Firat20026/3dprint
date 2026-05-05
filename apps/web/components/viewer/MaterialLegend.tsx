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
    <div className="rounded-xl border border-border bg-card p-4">
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
                  "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors " +
                  (isVisible
                    ? "border-border bg-secondary hover:border-primary/40"
                    : "border-transparent text-muted-foreground/70 line-through opacity-60 hover:opacity-100")
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: m.colorHex }}
                  />
                  <span className="font-medium text-foreground">
                    {m.name}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
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
