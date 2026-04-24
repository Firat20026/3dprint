import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-12 animate-fade-in">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-12 w-64" />
      <div className="mt-10 space-y-3" data-stagger>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </Container>
  );
}
