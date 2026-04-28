"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { markEarningPaid } from "@/app/admin/earnings/actions";

export function MarkEarningPaidButton({ earningId }: { earningId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    const note = prompt(
      "Ödeme notu (örn. IBAN, transfer ref. — tasarımcıya gösterilmez, audit için):",
    );
    if (note === null) return;
    const fd = new FormData();
    fd.set("earningId", earningId);
    fd.set("note", note);
    startTransition(async () => {
      const res = await markEarningPaid(fd);
      if (res.ok) router.refresh();
      else alert(res.error);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-md border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/5 px-3 py-1.5 text-xs text-[var(--color-brand-2)] hover:bg-[var(--color-brand)]/10 disabled:opacity-50"
    >
      <CheckCircle2 className="size-3.5" />
      {pending ? "…" : "Ödendi İşaretle"}
    </button>
  );
}
