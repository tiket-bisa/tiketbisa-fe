import { Pagination, Select } from "~/core/design-system/components";

interface TransactionPaginationControlsProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  itemCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const pageSizeOptions = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
];

export function TransactionPaginationControls({
  currentPage,
  pageSize,
  totalCount,
  itemCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: TransactionPaginationControlsProps) {
  const firstItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = totalCount === 0
    ? 0
    : Math.min(firstItem + itemCount - 1, totalCount);

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-border-default pt-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-tertiary whitespace-nowrap">
            Tampilkan
          </span>
          <Select
            aria-label="Jumlah entri per halaman"
            options={pageSizeOptions}
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.currentTarget.value))}
            className="w-24"
          />
          <span className="text-sm font-medium text-text-tertiary whitespace-nowrap">
            entri
          </span>
        </div>
        <p className="text-sm text-text-tertiary">
          Menampilkan {firstItem}-{lastItem} dari {totalCount} transaksi
        </p>
      </div>

      <div className="flex justify-start lg:justify-end">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
