import { Container } from "@/components/ui/container";
import { SkeletonCard } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-12 animate-fade-in">
      <div className="skeleton h-3 w-20" />
      <div className="mt-3 skeleton h-12 w-80" />
      <div className="mt-3 skeleton h-4 w-64" />
      <div
        className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        data-stagger
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </Container>
  );
}
