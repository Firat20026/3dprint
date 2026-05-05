import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors",
  {
    variants: {
      tone: {
        default:
          "bg-secondary text-secondary-foreground border-border",
        brand:
          "bg-foreground/10 text-foreground border-foreground/20",
        accent:
          "bg-foreground/10 text-foreground border-foreground/20",
        success:
          "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]",
        warning:
          "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]",
        destructive:
          "bg-destructive/15 text-destructive border-destructive/30",
        outline:
          "bg-transparent text-foreground border-border",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-[11px]",
        lg: "px-3 py-1 text-xs",
      },
      uppercase: {
        true: "uppercase tracking-wider",
        false: "",
      },
    },
    defaultVariants: {
      tone: "default",
      size: "md",
      uppercase: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, uppercase, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ tone, size, uppercase }), className)}
      {...props}
    />
  );
}

export { badgeVariants };
