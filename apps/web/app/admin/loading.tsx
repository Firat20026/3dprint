import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 animate-fade-in">
      <Skeleton className="h-8 w-72" />
      <div className="overflow-hidden overflow-x-auto rounded-xl border border-border">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} cells={6} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
