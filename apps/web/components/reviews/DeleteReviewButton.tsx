"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteOwnDesignReview } from "@/app/designs/[slug]/actions";

export function DeleteReviewButton({
  reviewId,
  slug,
}: {
  reviewId: string;
  slug: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Bu yorumu silmek istediğine emin misin?")) return;
    const fd = new FormData();
    fd.set("reviewId", reviewId);
    fd.set("slug", slug);
    startTransition(async () => {
      const res = await deleteOwnDesignReview(fd);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
    >
      <Trash2 className="size-3" />
      {pending ? "Siliniyor…" : "Sil"}
    </button>
  );
}
