"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /** Animation variant */
  variant?: "up" | "scale" | "right" | "fade";
  /** Trigger threshold 0-1 */
  threshold?: number;
  /** Stagger children with [data-stagger] mechanic */
  stagger?: boolean;
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  variant = "up",
  threshold = 0.15,
  stagger = false,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // If already in view on mount (e.g. above the fold) fire immediately.
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  const animClass = visible
    ? variant === "scale"
      ? "animate-fade-in-scale"
      : variant === "right"
        ? "animate-slide-in-right"
        : variant === "fade"
          ? "animate-fade-in"
          : "animate-fade-in-up"
    : "opacity-0";

  const style = visible && delay ? { animationDelay: `${delay}ms` } : undefined;

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`}
      style={style}
      {...(stagger ? { "data-stagger": true } : {})}
    >
      {children}
    </div>
  );
}
