"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck, Users, Layers } from "lucide-react";
import { FluidTabs } from "@/components/watermelon-ui/fluid-tabs";

export type Source = "all" | "ADMIN" | "USER_MARKETPLACE" | "MESHY";

interface SourceFilterTabsProps {
  active: Source;
  /** Pre-computed destination URLs for each source — server builds these so
   *  no functions cross the RSC boundary. */
  hrefs: Record<Source, string>;
}

/**
 * Watermelon fluid-tabs wrapper for /designs source filter.
 * On change we router.push to the precomputed URL — the tab pill animates
 * smoothly while the server returns the new filtered list.
 */
export function SourceFilterTabs({ active, hrefs }: SourceFilterTabsProps) {
  const router = useRouter();

  return (
    <FluidTabs
      tabs={[
        { id: "all", label: "Tümü", icon: <Layers className="size-4" /> },
        { id: "ADMIN", label: "Resmi", icon: <ShieldCheck className="size-4" /> },
        { id: "USER_MARKETPLACE", label: "Topluluk", icon: <Users className="size-4" /> },
        { id: "MESHY", label: "AI", icon: <Sparkles className="size-4" /> },
      ]}
      defaultActive={active}
      onChange={(id) => {
        const url = hrefs[id as Source];
        if (url) router.push(url);
      }}
    />
  );
}
