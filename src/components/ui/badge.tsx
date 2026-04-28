import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "warning" | "critical" | "success" | "muted";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const variants: Record<Variant, string> = {
    default: "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    muted: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
