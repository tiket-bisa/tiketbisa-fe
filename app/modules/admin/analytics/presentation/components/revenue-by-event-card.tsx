import { Badge, Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { type RevenueByEvent } from "~/modules/internal/analytics/analytics.api";

export function RevenueByEventCard({ data }: { data: RevenueByEvent[] }) {
  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b border-border-default">
        <h2 className="text-text-primary text-lg font-semibold">Revenue per Event</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-medium">Event</th>
              <th className="text-left px-4 py-3 font-medium">Brand</th>
              <th className="text-right px-4 py-3 font-medium">Tiket Terjual</th>
              <th className="text-right px-4 py-3 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.eventName} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3 text-text-primary">{item.eventName}</td>
                <td className="px-4 py-3 text-text-tertiary text-sm">{item.brand}</td>
                <td className="px-4 py-3 text-text-secondary text-right">
                  <Badge variant="brand">{item.ticketsSold}</Badge>
                </td>
                <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(item.revenue)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-default">
              <td colSpan={2} className="px-4 py-3 text-text-primary font-semibold">Total</td>
              <td className="px-4 py-3 text-text-primary text-right font-semibold">
                {data.reduce((s, i) => s + i.ticketsSold, 0)}
              </td>
              <td className="px-4 py-3 text-text-primary text-right font-semibold">
                {formatIDR(data.reduce((s, i) => s + i.revenue, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
