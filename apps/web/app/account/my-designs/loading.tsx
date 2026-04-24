import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-12 animate-fade-in">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-12 w-64" />
      <Skeleton className="mt-4 h-4 w-2/3 max-w-lg" />
      <Skeleton className="mt-10 h-8 w-56" />
      <Skeleton className="mt-4 h-[440px] w-full" />
      <Skeleton className="mt-12 h-8 w-56" />
      <Skeleton className="mt-4 h-40 w-full" />
    </Container>
  );
}
