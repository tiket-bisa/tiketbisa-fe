import { type InputHTMLAttributes, forwardRef } from "react";

export interface SearchInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onClear, value, className = "", ...props }, ref) => {
    return (
      <div className="relative">
        {/* Search icon */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary"
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
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>

        <input
          ref={ref}
          type="search"
          value={value}
          className={`w-full rounded-lg border border-border-default bg-surface-alt pl-9 pr-9 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors hover:border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent ${className}`}
          {...props}
        />

        {/* Clear button */}
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label="Clear search"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";
