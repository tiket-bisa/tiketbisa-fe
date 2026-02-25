import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-16 text-center ${className}`}
    >
      {/* Icon or default illustration */}
      {icon ? (
        <div className="mb-4 text-text-tertiary">{icon}</div>
      ) : (
        <div className="mb-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-surface-hover">
            <svg
              className="h-8 w-8 text-text-tertiary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h2.21a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859M12 3v8.25m0 0-3-3m3 3 3-3"
              />
            </svg>
          </div>
        </div>
      )}

      <h3 className="text-base font-semibold text-text-primary">{title}</h3>

      {description && (
        <p className="mt-1 text-sm text-text-tertiary max-w-sm">
          {description}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
