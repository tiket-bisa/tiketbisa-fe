import { SearchInput, Select } from "~/core/design-system/components";
import { statusFilterOptions } from "~/core/constants/transaction";
import { useApiQuery } from "~/core/api";
import { eventApi } from "~/core/api/services/event.api";

type TransactionSort = "newest" | "oldest";

const transactionSortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
];

interface DashboardFiltersProps {
  brandId?: string;
  search: string;
  onSearchChange: (val: string) => void;
  eventIdFilter: string;
  onEventIdFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  sortOrder: string;
  onSortOrderChange: (val: TransactionSort) => void;
}

export function DashboardFilters({
  brandId,
  search,
  onSearchChange,
  eventIdFilter,
  onEventIdFilterChange,
  statusFilter,
  onStatusFilterChange,
  sortOrder,
  onSortOrderChange,
}: DashboardFiltersProps) {
  // Fetch events for filter
  const { data: eventsRes } = useApiQuery(
    async () => brandId ? eventApi.getList({ brandId, limit: 100 }) : null,
    [brandId],
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
          aria-label="Semua Event"
          options={eventOptions}
          value={eventIdFilter}
          onChange={(e) => onEventIdFilterChange(e.target.value)}
          label=""
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          aria-label="Semua Status"
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          label=""
        />
      </div>
      <div className="w-full sm:w-40">
        <Select
          options={transactionSortOptions}
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value as TransactionSort)}
          label=""
        />
      </div>
    </div>
  );
}
