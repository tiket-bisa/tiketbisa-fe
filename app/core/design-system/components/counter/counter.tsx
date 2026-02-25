export interface CounterProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

export function Counter({
  value,
  min = 0,
  max = Infinity,
  onChange,
  className = "",
}: CounterProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Quantity selector"
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border-default text-text-secondary hover:bg-surface-hover disabled:text-text-tertiary disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Decrease"
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </button>

      <span className="min-w-[2rem] text-center text-sm font-medium text-text-primary tabular-nums">
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border-default text-text-secondary hover:bg-surface-hover disabled:text-text-tertiary disabled:cursor-not-allowed transition-colors cursor-pointer"
        aria-label="Increase"
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
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>
    </div>
  );
}
