import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "brand";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-hover text-text-secondary",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
  destructive: "bg-destructive-bg text-destructive-text",
  brand: "bg-brand-primary-subtle text-brand-primary",
};

export function Badge({
  variant = "default",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
