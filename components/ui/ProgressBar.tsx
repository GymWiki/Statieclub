import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percentage: number;
  className?: string;
  trackClassName?: string;
}

export function ProgressBar({ percentage, className, trackClassName }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  return (
    <div
      className={cn("h-2.5 w-full overflow-hidden rounded-full bg-gray-100", trackClassName)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700 ease-out",
          className
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
