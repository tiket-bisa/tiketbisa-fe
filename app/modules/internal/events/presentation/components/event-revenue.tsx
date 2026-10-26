import { formatIDR } from "~/core/utils";

interface EventRevenueProps {
  revenue?: number | null;
}

export function EventRevenue({ revenue }: EventRevenueProps) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-border-default bg-surface-primary px-4 py-3">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-primary-subtle text-brand-primary"
      >
        <span className="material-symbols-outlined text-lg leading-none">payments</span>
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
          Revenue
        </p>
        <p className="truncate text-sm font-semibold tabular-nums text-text-primary">
          {formatIDR(revenue ?? 0)}
        </p>
      </div>
    </div>
  );
}
