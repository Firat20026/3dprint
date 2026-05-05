"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, RotateCcw } from "lucide-react";
import type { ReviewStatus } from "@prisma/client";
import { hideReview, restoreReview } from "@/app/admin/reviews/actions";

export function ReviewModerationButtons({
  reviewId,
  status,
}: {
  reviewId: string;
  status: ReviewStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onHide() {
    const reason = prompt("Gizleme sebebi (kullanıcıya gösterilmez, audit için):");
    if (reason === null) return; // user canceled
    const fd = new FormData();
    fd.set("reviewId", reviewId);
    fd.set("reason", reason);
    startTransition(async () => {
      const res = await hideReview(fd);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  }

  function onRestore() {
    const fd = new FormData();
    fd.set("reviewId", reviewId);
    startTransition(async () => {
      const res = await restoreReview(fd);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  }

  if (status === "HIDDEN") {
    return (
      <button
        type="button"
        onClick={onRestore}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-3 py-1.5 text-xs hover:border-primary/40 disabled:opacity-50"
      >
        <RotateCcw className="size-3.5" />
        {pending ? "…" : "Geri Yayınla"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onHide}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
    >
      <EyeOff className="size-3.5" />
      {pending ? "…" : "Gizle"}
    </button>
  );
}
