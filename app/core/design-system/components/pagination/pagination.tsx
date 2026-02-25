export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav
      className={`flex items-center gap-1 ${className}`}
      aria-label="Pagination"
    >
      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-secondary hover:bg-surface-hover disabled:text-text-tertiary disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Previous page"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
      </button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="inline-flex items-center justify-center h-9 w-9 text-sm text-text-tertiary"
          >
            …
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page as number)}
            className={`inline-flex items-center justify-center h-9 w-9 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              page === currentPage
                ? "bg-brand-primary text-base-white"
                : "text-text-secondary hover:bg-surface-hover"
            }`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ),
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-secondary hover:bg-surface-hover disabled:text-text-tertiary disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Next page"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
      </button>
    </nav>
  );
}

/** Build a compact page-number array with ellipsis markers. */
function getVisiblePages(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
