import { Select } from "~/core/design-system/components";
import type { SelectOption } from "~/core/design-system/components";

export interface SortDropdownProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function SortDropdown({
  value,
  options,
  onChange,
  className = "",
}: SortDropdownProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-text-tertiary whitespace-nowrap">
        Sort by
      </span>
      <Select
        options={options}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="w-auto min-w-[140px]"
      />
    </div>
  );
}
