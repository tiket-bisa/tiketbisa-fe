import { Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { type RevenueTimeline } from "~/modules/internal/analytics/analytics.api";

export function RevenueTimelineCard({ data, maxRevenue }: { data: RevenueTimeline[], maxRevenue: number }) {

  return (
    <Card padding="md">
      <h2 className="text-text-primary text-lg font-semibold mb-4">Revenue Harian</h2>
      <div className="space-y-3">
        {data.map((point) => (
          <div key={point.date} className="flex items-center gap-3">
            <span className="text-text-tertiary text-xs w-24 shrink-0 font-mono">{point.date.slice(5)}</span>
            <div className="flex-1 h-6 bg-surface-hover rounded-md overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-md transition-all"
                style={{ width: `${(point.revenue / maxRevenue) * 100}%` }}
              />
            </div>
            <span className="text-text-secondary text-xs w-28 text-right shrink-0">{formatIDR(point.revenue)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
