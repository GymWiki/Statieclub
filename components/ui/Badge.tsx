import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { statusKleur, statusLabel } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: string;
}

export function StatusBadge({ status, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusKleur(status),
        className
      )}
      {...props}
    >
      {statusLabel(status)}
    </span>
  );
}
