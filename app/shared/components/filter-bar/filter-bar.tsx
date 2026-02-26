import { SearchInput, Select } from "~/core/design-system/components";
import type { FilterBarFilter } from "./types";

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchClear?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  filters?: FilterBarFilter[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Search…",
  showSearch = true,
  filters,
  filterValues = {},
  onFilterChange,
  className = "",
}: FilterBarProps) {
  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center ${className}`}
    >
      {/* Search */}
      {showSearch && (
        <div className="flex-1 min-w-0 sm:max-w-xs">
          <SearchInput
            value={searchValue}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            onClear={onSearchClear}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      {/* Filters */}
      {filters && filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Select
              key={filter.key}
              options={filter.options}
              value={filterValues[filter.key] ?? ""}
              onChange={(e) =>
                onFilterChange?.(filter.key, e.currentTarget.value)
              }
              placeholder={filter.label}
              className="w-auto min-w-[140px]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
