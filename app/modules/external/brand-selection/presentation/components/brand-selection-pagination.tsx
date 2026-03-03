import { Pagination, Select } from "~/core/design-system/components";

interface BrandSelectionPaginationProps {
  currentPage: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: string) => void;
}

export function BrandSelectionPagination({
  currentPage,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: BrandSelectionPaginationProps) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-border-default pt-6">
      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-text-tertiary whitespace-nowrap hidden sm:block">
          Show:
        </label>
        <Select
          options={[
            { value: "12", label: "12" },
            { value: "24", label: "24" },
            { value: "48", label: "48" },
          ]}
          value={String(limit)}
          onChange={(e) => onLimitChange(e.currentTarget.value)}
          placeholder="Show"
          className="w-24"
        />
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
