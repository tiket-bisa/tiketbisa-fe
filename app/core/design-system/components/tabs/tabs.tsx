export interface TabItem {
  label: string;
  value: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className = "" }: TabsProps) {
  return (
    <div
      className={`flex border-b border-border-default ${className}`}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              isActive
                ? "text-brand-primary"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {item.count !== undefined && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 ${
                    isActive
                      ? "bg-brand-primary-subtle text-brand-primary"
                      : "bg-surface-hover text-text-tertiary"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </span>
            {/* Active indicator */}
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
