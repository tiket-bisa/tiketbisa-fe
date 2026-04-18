import { Card, Badge } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { useAuth } from "~/core/auth";
import { useRevenueAnalyticsData } from "./use-revenue-analytics";

/** Partner — Revenue Analytics (filtered by partner's brand) */
export default function RevenueAnalyticsPage() {
  const { user } = useAuth();
  const {
    brandTransactions,
    totalRevenue,
    totalTicketsSold,
    revenueByEvent,
    ticketsByCategory,
    revenueTimeline,
    maxRevenue,
  } = useRevenueAnalyticsData(user?.brand_slug);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Analitik Revenue</h1>
        {user?.brand_name && (
          <p className="text-text-tertiary text-sm mt-1">{user.brand_name}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">
            Total Revenue
          </p>
          <p className="text-text-primary text-2xl font-bold mt-1">
            {formatIDR(totalRevenue)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">
            Total Transaksi
          </p>
          <p className="text-text-primary text-2xl font-bold mt-1">
            {brandTransactions.length}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">
            Tiket Terjual
          </p>
          <p className="text-text-primary text-2xl font-bold mt-1">
            {totalTicketsSold}
          </p>
        </Card>
      </div>

      {/* Revenue Timeline (Bar Chart) */}
      <Card padding="md">
        <h2 className="text-text-primary text-lg font-semibold mb-4">
          Revenue Harian
        </h2>
        <div className="space-y-3">
          {revenueTimeline.map((point) => (
            <div key={point.date} className="flex items-center gap-3">
              <span className="text-text-tertiary text-xs w-24 shrink-0 font-mono">
                {point.date.slice(5)}
              </span>
              <div className="flex-1 h-6 bg-surface-hover rounded-md overflow-hidden">
                <div
                  className="h-full bg-brand-primary rounded-md transition-all"
                  style={{
                    width: `${(point.revenue / maxRevenue) * 100}%`,
                  }}
                />
              </div>
              <span className="text-text-secondary text-xs w-28 text-right shrink-0">
                {formatIDR(point.revenue)}
              </span>
            </div>
          ))}
          {revenueTimeline.length === 0 && (
            <p className="text-center text-text-tertiary text-sm py-4">Belum ada data revenue</p>
          )}
        </div>
      </Card>

      {/* Tickets Sold by Category */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-text-primary text-lg font-semibold">
            Tiket Terjual per Kategori
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Kategori Tiket</th>
                <th className="text-right px-4 py-3 font-medium">Jumlah Terjual</th>
                <th className="text-right px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {ticketsByCategory.map((item) => (
                <tr key={item.category} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{item.category}</td>
                  <td className="px-4 py-3 text-text-secondary text-right">
                    <Badge variant="brand">{item.quantity}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(item.revenue)}</td>
                </tr>
              ))}
              {ticketsByCategory.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-text-tertiary text-sm">Belum ada data</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-default">
                <td className="px-4 py-3 text-text-primary font-semibold">Total</td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {ticketsByCategory.reduce((s, i) => s + i.quantity, 0)}
                </td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {formatIDR(ticketsByCategory.reduce((s, i) => s + i.revenue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Revenue by Event */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-text-primary text-lg font-semibold">
            Revenue per Event
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Event</th>
                <th className="text-right px-4 py-3 font-medium">Tiket Terjual</th>
                <th className="text-right px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenueByEvent.map((item) => (
                <tr
                  key={item.event_name}
                  className="border-b border-border-subtle hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-3 text-text-primary">
                    {item.event_name}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-right">
                    <Badge variant="brand">{item.tickets_sold}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right font-medium">
                    {formatIDR(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-default">
                <td className="px-4 py-3 text-text-primary font-semibold">
                  Total
                </td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {revenueByEvent.reduce((s, i) => s + i.tickets_sold, 0)}
                </td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {formatIDR(
                    revenueByEvent.reduce((s, i) => s + i.revenue, 0)
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
