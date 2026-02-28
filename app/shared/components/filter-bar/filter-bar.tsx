import { useState, useMemo } from "react";
import {
  Button,
  SearchInput,
  Select,
  Badge,
} from "~/core/design-system/components";
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
  onReset?: () => void;
  className?: string;
}

/**
 * FilterBar Component
 * Decoupled into sub-components for better performance and maintainability.
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Search…",
  showSearch = true,
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  className = "",
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeCount = useMemo(() => {
    return Object.values(filterValues).filter((val) => val !== "").length;
  }, [filterValues]);

  const activeChips = useMemo(() => {
    return filters.flatMap((filter) => {
      const val = filterValues[filter.key];
      if (!val) return [];

      const option = filter.options.find((o) => o.value === val);
      return [
        {
          key: filter.key,
          label: filter.label,
          valueLabel: option?.label || val,
        },
      ];
    });
  }, [filters, filterValues]);

  const hasActiveFilters = activeCount > 0;

  const handleRemoveOne = (key: string) => {
    onFilterChange?.(key, "");
  };

  const handleReset = () => {
    onReset?.();
    setIsExpanded(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Bar Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {showSearch && (
          <div className="flex-1 min-w-0 max-w-sm">
            <SearchInput
              value={searchValue}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              onClear={onSearchClear}
              placeholder={searchPlaceholder}
            />
          </div>
        )}

        <Button
          variant={isExpanded ? "primary" : "secondary"}
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
          <span className="font-semibold">Filter</span>
          {activeCount > 0 && (
            <Badge variant="brand" className="px-1.5 py-0.5 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="hidden lg:flex text-destructive-text px-3"
          >
            <span className="text-sm font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">
                restart_alt
              </span>
              Reset
            </span>
          </Button>
        )}
      </div>

      {/* Active Filter Chips (Desktop Only) */}
      {hasActiveFilters && (
        <div className="hidden lg:flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-wider mr-1">
            Aktif:
          </span>
          {activeChips.map((chip) => (
            <ActiveChip
              key={chip.key}
              chip={chip}
              onRemove={() => handleRemoveOne(chip.key)}
            />
          ))}
        </div>
      )}

      {/* Inline Desktop Filters */}
      <div
        className={`hidden lg:block transition-all duration-300 overflow-hidden ${
          isExpanded
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-surface-alt p-6 rounded-2xl border border-border-default mt-4">
          <FilterControls
            filters={filters}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            onRemoveOne={handleRemoveOne}
            onClose={() => setIsExpanded(false)}
          />
        </div>
      </div>

      {/* Mobile Overlay (Only rendered when expanded to save DOM nodes) */}
      {isExpanded && (
        <MobileFilterOverlay
          activeCount={activeCount}
          filters={filters}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onRemoveOne={handleRemoveOne}
          onReset={handleReset}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

/**
 * --- SUB-COMPONENTS (Defined outside to prevent remounting) ---
 */

interface ControlsProps {
  filters: FilterBarFilter[];
  filterValues: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onRemoveOne: (key: string) => void;
  onClose: () => void;
}

function FilterControls({
  filters,
  filterValues,
  onFilterChange,
  onRemoveOne,
  onClose,
}: ControlsProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-3">
      {filters.map((filter) => {
        const hasValue = !!filterValues[filter.key];
        return (
          <div key={filter.key} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-text-tertiary lg:hidden">
                {filter.label}
              </label>
              {hasValue && (
                <button
                  onClick={() => onRemoveOne(filter.key)}
                  className="flex items-center gap-1 font-bold text-destructive-text lg:hidden text-[10px] uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                  Hapus
                </button>
              )}
            </div>
            <Select
              options={filter.options}
              value={filterValues[filter.key] ?? ""}
              onChange={(e) =>
                onFilterChange?.(filter.key, e.currentTarget.value)
              }
              placeholder={`Semua ${filter.label}`}
              className="w-full lg:w-auto lg:min-w-[160px]"
            />
          </div>
        );
      })}

      <Button
        variant="primary"
        fullWidth
        className="mt-4 lg:hidden py-4 text-lg font-bold"
        onClick={onClose}
      >
        Kembali
      </Button>
    </div>
  );
}

function MobileFilterOverlay({
  activeCount,
  filters,
  filterValues,
  onFilterChange,
  onRemoveOne,
  onReset,
  onClose,
}: ControlsProps & { activeCount: number; onReset: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-surface-primary p-6 lg:hidden animate-in fade-in slide-in-from-bottom-full duration-500 overflow-y-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-default">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-text-primary">Filter</h2>
          {activeCount > 0 && <Badge variant="brand">{activeCount}</Badge>}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 rounded-full bg-surface-alt text-text-primary hover:rotate-180 transition-transform duration-500"
          title="Refresh page"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <FilterControls
        filters={filters}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onRemoveOne={onRemoveOne}
        onClose={onClose}
      />

      {activeCount > 0 && (
        <div className="mt-8 pt-8 border-t border-border-default">
          <Button
            variant="ghost"
            fullWidth
            onClick={onReset}
            className="text-destructive-text font-bold"
          >
            Hapus Semua Filter
          </Button>
        </div>
      )}
    </div>
  );
}

function ActiveChip({
  chip,
  onRemove,
}: {
  chip: { label: string; valueLabel: string };
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/30 rounded-full pl-3 pr-1 py-1 group hover:border-brand-primary transition-colors">
      <span className="text-xs font-medium text-brand-primary whitespace-nowrap">
        <span className="opacity-60">{chip.label}:</span> {chip.valueLabel}
      </span>
      <button
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-brand-primary hover:text-white transition-all text-brand-primary"
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
    </div>
  );
}
