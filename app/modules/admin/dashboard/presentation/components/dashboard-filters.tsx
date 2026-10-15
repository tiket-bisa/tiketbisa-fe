import { SearchInput, Select } from "~/core/design-system/components";
import { statusFilterOptions } from "~/core/constants/transaction";
import { useApiQuery } from "~/core/api";
import { eventApi } from "~/core/api/services/event.api";
import { brandApi } from "~/core/api/services/brand.api";

type TransactionSort = "newest" | "oldest";

const transactionSortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
];

interface DashboardFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  brandIdFilter: string;
  onBrandIdFilterChange: (val: string) => void;
  eventIdFilter: string;
  onEventIdFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: TransactionSort) => void;
}

export function DashboardFilters({
  search,
  onSearchChange,
  brandIdFilter,
  onBrandIdFilterChange,
  eventIdFilter,
  onEventIdFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: DashboardFiltersProps) {
  // Fetch brands for filter
  const { data: brandsRes } = useApiQuery(
    async () => brandApi.getList({ limit: 100 }),
    []
  );
  const brandOptions = [
    { value: "all", label: "Semua Brand" },
    ...(brandsRes?.data?.brands?.map(b => ({ value: b.id, label: b.name })) ?? [])
  ];

  // Fetch events based on selected brand
  const { data: eventsRes } = useApiQuery(
    async () => eventApi.getList({ 
      brandId: brandIdFilter === "all" ? undefined : brandIdFilter, 
      limit: 100 
    }),
    [brandIdFilter]
  );
  const eventOptions = [
    { value: "all", label: "Semua Event" },
    ...(eventsRes?.data?.events?.map(e => ({ value: e.id, label: e.name })) ?? [])
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex-1">
        <SearchInput
          placeholder="Cari ID atau pembeli..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          options={brandOptions}
          value={brandIdFilter}
          onChange={(e) => {
            onBrandIdFilterChange(e.target.value);
            onEventIdFilterChange("all");
          }}
          label=""
          aria-label="Filter Brand"
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          options={eventOptions}
          value={eventIdFilter}
          onChange={(e) => onEventIdFilterChange(e.target.value)}
          label=""
          aria-label="Filter Event"
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          label=""
          aria-label="Filter Status"
        />
      </div>
      <div className="w-full sm:w-40">
        <Select
          options={transactionSortOptions}
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value as TransactionSort)}
          label=""
          aria-label="Urutkan Transaksi"
        />
      </div>
    </div>
  );
}
