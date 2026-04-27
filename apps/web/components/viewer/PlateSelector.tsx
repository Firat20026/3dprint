"use client";

/**
 * PlateSelector — tab-style selector that picks which plate of a multi-plate
 * 3MF is shown in the viewer. Includes an "All" option for previewing the
 * full build at once.
 *
 * For single-plate designs the parent shouldn't render this at all.
 */

export function PlateSelector({
  plateCount,
  selected, // null = "All"
  onSelect,
}: {
  plateCount: number;
  selected: number | null;
  onSelect: (plate: number | null) => void;
}) {
  if (plateCount <= 1) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="eyebrow">Plate'ler</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Her plate ayrı bastırılır — sepete farklı materyallerle ayrı satır olarak eklenir.
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <PlateChip
          label="Hepsi"
          active={selected === null}
          onClick={() => onSelect(null)}
        />
        {Array.from({ length: plateCount }, (_, i) => (
          <PlateChip
            key={i}
            label={`Plate ${i + 1}`}
            active={selected === i}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}

function PlateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-xs transition-colors " +
        (active
          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-2)]"
          : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-brand)]/40 hover:text-[var(--color-text)]")
      }
    >
      {label}
    </button>
  );
}
