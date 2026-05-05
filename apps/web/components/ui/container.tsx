import * as React from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  size = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: "default" | "narrow" | "wide" | "full";
}) {
  const widths = {
    narrow: "max-w-3xl",
    default: "max-w-7xl",
    wide: "max-w-[88rem]",
    full: "max-w-none",
  };
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", widths[size], className)}
      {...props}
    />
  );
}
