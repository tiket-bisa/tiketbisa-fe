export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
  boundaryCount?: number;
}

type PageItem = number | "...";

const ELLIPSIS: PageItem = "...";

interface PaginationOptions {
  current: number;
  total: number;
  siblingCount: number;
  boundaryCount: number;
}

function range(start: number, end: number): number[] {
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getVisiblePages({
  current,
  total,
  siblingCount,
  boundaryCount,
}: PaginationOptions): PageItem[] {
  const totalNumbers = siblingCount * 2 + 3 + boundaryCount * 2;

  if (total <= totalNumbers) {
    return range(1, total);
  }

  const startPages = range(1, boundaryCount);
  const endPages = range(total - boundaryCount + 1, total);

  const siblingsStart = Math.max(current - siblingCount, boundaryCount + 2);
  const siblingsEnd = Math.min(
    current + siblingCount,
    total - boundaryCount - 1,
  );

  const showLeftEllipsis = siblingsStart > boundaryCount + 2;
  const showRightEllipsis = siblingsEnd < total - boundaryCount - 1;

  const pages: PageItem[] = [...startPages];

  if (showLeftEllipsis) {
    pages.push(ELLIPSIS);
  } else {
    pages.push(...range(boundaryCount + 1, siblingsStart - 1));
  }

  pages.push(...range(siblingsStart, siblingsEnd));

  if (showRightEllipsis) {
    pages.push(ELLIPSIS);
  } else {
    pages.push(...range(siblingsEnd + 1, total - boundaryCount));
  }

  pages.push(...endPages);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  siblingCount = 1,
  boundaryCount = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages({
    current: currentPage,
    total: totalPages,
    siblingCount,
    boundaryCount,
  });

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
            onClick={() => onPageChange(page)}
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
