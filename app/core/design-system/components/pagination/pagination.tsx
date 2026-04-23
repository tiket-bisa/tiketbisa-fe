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
  // If total pages are 7 or less, just show all of them.
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  
  // Always show first page
  pages.push(1);

  // Calculate start and end bounds around current page
  let start = current - 1;
  let end = current + 1;

  // Adjust bounds if we are near the edges
  if (current <= 3) {
    start = 2;
    end = 4;
  } else if (current >= total - 2) {
    start = total - 3;
    end = total - 1;
  }

  // Insert start ellipsis
  if (start > 2) {
    pages.push("...");
  }

  // Insert middle pages
  for (let i = start; i <= end; i++) {
    if (i > 1 && i < total) {
      pages.push(i);
    }
  }

  // Insert end ellipsis
  if (end < total - 1) {
    pages.push("...");
  }

  // Always show last page
  pages.push(total);

  return pages;
}
