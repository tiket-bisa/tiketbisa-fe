import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        {subtitle && <p className="text-sm text-text-tertiary">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
