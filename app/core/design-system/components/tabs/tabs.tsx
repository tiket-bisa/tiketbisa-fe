import { useRef, type KeyboardEvent } from "react";

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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    onChange(items[nextIndex].value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      className={`flex max-w-full overflow-x-auto border-b border-border-default [scrollbar-width:thin] ${className}`}
      role="tablist"
    >
      {items.map((item, index) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            ref={(element) => { tabRefs.current[index] = element; }}
            role="tab"
            type="button"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => moveFocus(event, index)}
            className={`relative shrink-0 cursor-pointer px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary ${
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
