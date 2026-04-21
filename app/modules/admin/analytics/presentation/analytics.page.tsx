/**
 * TODO: Replace mock analytics data with real API calls when
 * the backend adds aggregation/analytics endpoints (e.g. GET /analytics/revenue).
 * Currently, the BE has no transaction list or revenue aggregation endpoint.
 */
import { useMemo } from "react";
import { Card, Badge } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import {
  allRevenueSummary,
  allRevenueByBrand,
  allRevenueByEvent,
  allRevenueTimeline,
} from "../infrastructure/revenue.mock";
import { allTransactions } from "../../dashboard/infrastructure/transaction.mock";

/** Admin — Revenue Analytics (across all brands) */
export default function AdminAnalyticsPage() {
  const summary = allRevenueSummary;
  const maxRevenue = Math.max(...allRevenueTimeline.map((d) => d.revenue));

  // Tickets sold per category (ticket_name) from paid transactions
  const ticketsByCategory = useMemo(() => {
    const map: Record<string, { category: string; quantity: number; revenue: number }> = {};
    for (const tx of allTransactions.filter((t) => t.status === "paid")) {
      if (!map[tx.ticket_name]) {
        map[tx.ticket_name] = { category: tx.ticket_name, quantity: 0, revenue: 0 };
      }
      map[tx.ticket_name].quantity += tx.quantity;
      map[tx.ticket_name].revenue += tx.total_price;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Analitik Revenue</h1>
        <p className="text-text-tertiary text-sm mt-1">
          Platform — Periode: {summary.period}
        </p>
      </div>

      {/* Summary Cards */}
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

      {/* Revenue by Brand */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-text-primary text-lg font-semibold">Revenue per Brand</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-medium">Brand</th>
                <th className="text-right px-4 py-3 font-medium">Transaksi</th>
                <th className="text-right px-4 py-3 font-medium">Tiket Terjual</th>
                <th className="text-right px-4 py-3 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {allRevenueByBrand.map((item) => (
                <tr key={item.brand_name} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{item.brand_name}</td>
                  <td className="px-4 py-3 text-text-secondary text-right">{item.transactions}</td>
                  <td className="px-4 py-3 text-text-secondary text-right">
                    <Badge variant="brand">{item.tickets_sold}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-default">
                <td className="px-4 py-3 text-text-primary font-semibold">Total</td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {allRevenueByBrand.reduce((s, i) => s + i.transactions, 0)}
                </td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {allRevenueByBrand.reduce((s, i) => s + i.tickets_sold, 0)}
                </td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {formatIDR(allRevenueByBrand.reduce((s, i) => s + i.revenue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Revenue Timeline */}
      <Card padding="md">
        <h2 className="text-text-primary text-lg font-semibold mb-4">Revenue Harian</h2>
        <div className="space-y-3">
          {allRevenueTimeline.map((point) => (
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

      {/* Tickets Sold by Category */}
      <Card padding="none">
        <div className="px-4 py-3 border-b border-border-default">
          <h2 className="text-text-primary text-lg font-semibold">Tiket Terjual per Kategori</h2>
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
              {allRevenueByEvent.map((item) => (
                <tr key={item.event_name} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-3 text-text-primary">{item.event_name}</td>
                  <td className="px-4 py-3 text-text-tertiary text-sm">{item.brand}</td>
                  <td className="px-4 py-3 text-text-secondary text-right">
                    <Badge variant="brand">{item.tickets_sold}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border-default">
                <td colSpan={2} className="px-4 py-3 text-text-primary font-semibold">Total</td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {allRevenueByEvent.reduce((s, i) => s + i.tickets_sold, 0)}
                </td>
                <td className="px-4 py-3 text-text-primary text-right font-semibold">
                  {formatIDR(allRevenueByEvent.reduce((s, i) => s + i.revenue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
