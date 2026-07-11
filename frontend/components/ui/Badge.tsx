import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "destructive" | "warning" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/10 text-success border border-success/20",
  destructive: "bg-destructive/10 text-destructive border border-destructive/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  outline: "border border-border text-foreground",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
