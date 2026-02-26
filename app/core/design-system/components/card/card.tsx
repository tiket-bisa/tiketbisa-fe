import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export function Card({
  hoverable = false,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border-default bg-surface-alt shadow-md overflow-hidden ${paddingClasses[padding]} ${
        hoverable
          ? "transition-all hover:border-border-subtle hover:bg-surface-hover hover:shadow-lg cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    />
  );
}
