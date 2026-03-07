import { useMemo } from "react";
import { Card, Badge } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { useAuth } from "~/core/auth";
import { mockTransactions } from "../../dashboard/infrastructure/transaction.mock";
import { mockEvents } from "../../events/infrastructure/event.mock";

/** Partner — Revenue Analytics (filtered by partner's brand) */
export default function RevenueAnalyticsPage() {
  const { user } = useAuth();

  // Filter data by partner's brand
  const brandTransactions = useMemo(
    () => mockTransactions.filter((t) => t.brand_slug === user?.brand_slug),
    [user?.brand_slug],
  );
  const brandEvents = useMemo(
    () => mockEvents.filter((e) => e.brand_slug === user?.brand_slug),
    [user?.brand_slug],
  );

  const paidTransactions = brandTransactions.filter((t) => t.status === "paid");
  const totalRevenue = paidTransactions.reduce((s, t) => s + t.total_price, 0);
  const totalTicketsSold = paidTransactions.reduce((s, t) => s + t.quantity, 0);

  // Revenue by event
  const revenueByEvent = useMemo(() => {
    const map: Record<string, { event_name: string; revenue: number; tickets_sold: number }> = {};
    for (const tx of paidTransactions) {
      if (!map[tx.event_id]) {
        map[tx.event_id] = { event_name: tx.event_name, revenue: 0, tickets_sold: 0 };
      }
      map[tx.event_id].revenue += tx.total_price;
      map[tx.event_id].tickets_sold += tx.quantity;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidTransactions]);

  // Tickets sold per category (ticket_name)
  const ticketsByCategory = useMemo(() => {
    const map: Record<string, { category: string; quantity: number; revenue: number }> = {};
    for (const tx of paidTransactions) {
      if (!map[tx.ticket_name]) {
        map[tx.ticket_name] = { category: tx.ticket_name, quantity: 0, revenue: 0 };
      }
      map[tx.ticket_name].quantity += tx.quantity;
      map[tx.ticket_name].revenue += tx.total_price;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidTransactions]);

  // Revenue timeline (daily)
  const revenueTimeline = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; transactions: number }> = {};
    for (const tx of paidTransactions) {
      const date = tx.created_at.slice(0, 10);
      if (!map[date]) {
        map[date] = { date, revenue: 0, transactions: 0 };
      }
      map[date].revenue += tx.total_price;
      map[date].transactions += 1;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [paidTransactions]);

  const maxRevenue = Math.max(...revenueTimeline.map((d) => d.revenue), 1);

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
