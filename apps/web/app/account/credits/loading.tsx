import { Container } from "@/components/ui/container";
import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-12 animate-fade-in">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-12 w-64" />
      <Skeleton className="mt-10 h-40 w-full" />
      <Skeleton className="mt-14 h-8 w-56" />
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
      <Skeleton className="mt-14 h-8 w-56" />
      <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} cells={4} />
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
