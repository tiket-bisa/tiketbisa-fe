import { Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { type RevenueSummary } from "~/modules/internal/analytics/analytics.api";

export function RevenueSummaryCards({ summary }: { summary: RevenueSummary }) {

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card padding="md">
        <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Revenue</p>
        <p className="text-text-primary text-2xl font-bold mt-1">{formatIDR(summary.total_revenue)}</p>
      </Card>
      <Card padding="md">
        <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Transaksi</p>
        <p className="text-text-primary text-2xl font-bold mt-1">{summary.total_transactions}</p>
      </Card>
      <Card padding="md">
        <p className="text-text-tertiary text-xs uppercase tracking-wide">Tiket Terjual</p>
        <p className="text-text-primary text-2xl font-bold mt-1">{summary.total_tickets_sold}</p>
      </Card>
    </div>
  );
}
