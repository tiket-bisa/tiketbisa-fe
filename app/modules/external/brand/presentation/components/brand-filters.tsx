import { FilterBar } from "~/shared/components";
import { Select } from "~/core/design-system/components";
import { BRAND_FILTERS, SORT_OPTIONS } from "~/shared/constants/brand.constants";

interface BrandFiltersProps {
  sortValue: string;
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
  onSortChange: (value: string) => void;
}

export function BrandFilters({
  sortValue,
  filterValues,
  onFilterChange,
  onReset,
  onSortChange,
}: BrandFiltersProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-10">
      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        showSearch={false}
        filters={BRAND_FILTERS}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onReset={onReset}
        className="flex-1"
      />
      <div className="flex items-center gap-3 mt-4 sm:mt-0">
        <label className="text-sm font-bold text-text-tertiary whitespace-nowrap hidden sm:block">
          Urutkan:
        </label>
        <Select
          options={SORT_OPTIONS}
          value={sortValue}
          onChange={(e) => onSortChange(e.currentTarget.value)}
          placeholder="Pilih Urutan"
          className="w-full sm:w-auto min-w-[180px]"
        />
      </div>
    </div>
  );
}
