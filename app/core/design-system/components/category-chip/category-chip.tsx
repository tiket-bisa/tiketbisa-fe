export interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryChip({
  label,
  selected = false,
  onClick,
  className = "",
}: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
        selected
          ? "bg-brand-primary text-base-white"
          : "bg-surface-hover text-text-secondary hover:bg-brand-primary-subtle hover:text-brand-primary"
      } ${className}`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
