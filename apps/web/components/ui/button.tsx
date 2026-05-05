"use client";

/**
 * Button — drop-in re-export of Watermelon UI's animated-button.
 *
 * - Adds whileHover scale (1.03) + whileTap (0.97) micro-interaction via motion.
 * - Tweaks default + secondary variants to our minimal monochrome palette
 *   (foreground for primary, secondary card for secondary).
 * - Maps our legacy size names (md, xl) onto Watermelon's (default, lg) so
 *   existing call sites keep working without changes.
 */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { isMotionComponent, motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary: "bg-foreground text-background hover:bg-foreground/90",
        // alias of primary, kept so Watermelon's "default" callers still work
        default: "bg-foreground text-background hover:bg-foreground/90",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-muted",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
        outline:
          "bg-transparent border border-border text-foreground hover:bg-secondary",
        accent: "bg-foreground text-background hover:bg-foreground/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "bg-transparent text-foreground underline-offset-4 hover:underline px-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        // alias of md
        default: "h-10 px-4 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-6 text-sm",
        xl: "h-12 px-7 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 [&_svg]:size-3.5",
        "icon-lg": "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export type ButtonProps = ButtonPrimitiveProps & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };

/* ─── Motion primitive (Watermelon-style) ──────────────────────────── */

type ButtonPrimitiveProps = WithAsChild<
  HTMLMotionProps<"button"> & {
    hoverScale?: number;
    tapScale?: number;
  }
>;

function ButtonPrimitive({
  hoverScale = 1.03,
  tapScale = 0.97,
  asChild = false,
  ...props
}: ButtonPrimitiveProps) {
  const Component = asChild ? Slot : motion.button;
  return (
    <Component
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      {...props}
    />
  );
}

type AnyProps = Record<string, unknown>;

type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLMotionProps<keyof HTMLElementTagNameMap>,
  "ref"
> & { ref?: React.Ref<T> };

type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: React.ReactElement })
  | (Base & { asChild?: false | undefined });

type SlotProps<T extends HTMLElement = HTMLElement> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: any;
} & DOMMotionProps<T>;

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        (ref as (n: T | null) => void)(node);
      } else {
        (ref as React.RefObject<T | null>).current = node;
      }
    }
  };
}

function mergeProps<T extends HTMLElement>(
  childProps: AnyProps,
  slotProps: DOMMotionProps<T>
): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };
  if (childProps.className || slotProps.className) {
    merged.className = cn(childProps.className as string, slotProps.className as string);
  }
  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }
  return merged;
}

function Slot<T extends HTMLElement = HTMLElement>({
  children,
  ref,
  ...props
}: SlotProps<T>) {
  const isAlreadyMotion =
    typeof children.type === "object" &&
    children.type !== null &&
    isMotionComponent(children.type);

  // motion.create returns a dynamic-typed component whose ref/props signatures
  // can collapse to `never` under strict mode. Treat as `any` here — the call
  // sites are still strongly typed via ButtonProps.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Base = React.useMemo<any>(
    () =>
      isAlreadyMotion
        ? (children.type as React.ElementType)
        : motion.create(children.type as React.ElementType),
    [isAlreadyMotion, children.type]
  );

  if (!React.isValidElement(children)) return null;

  const { ref: childRef, ...childProps } = children.props as AnyProps;
  const mergedProps = mergeProps(childProps, props);
  const refProp = mergeRefs<T>(childRef as React.Ref<T>, ref as React.Ref<T> | undefined);
  return <Base {...mergedProps} ref={refProp} />;
}
