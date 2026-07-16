"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
}

/**
 * Telt visueel op/af naar de nieuwe waarde en flitst kort groen op —
 * de "instant gratification" wanneer een team score maakt.
 */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const [flash, setFlash] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    const from = previous.current;
    const to = value;
    const duration = 600;
    const start = performance.now();

    setFlash(true);
    const timeout = setTimeout(() => setFlash(false), 900);

    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    previous.current = value;

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [value]);

  return (
    <span
      className={cn(
        "inline-block rounded-md px-1 transition-transform",
        flash && "animate-count-flash animate-pop",
        className
      )}
    >
      {format ? format(display) : display}
    </span>
  );
}
