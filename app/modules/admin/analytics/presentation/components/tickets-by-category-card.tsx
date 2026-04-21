import { useMemo } from "react";
import { Badge, Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { allTransactions } from "~/modules/admin/dashboard/infrastructure/transaction.mock";

export function TicketsByCategoryCard() {
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
  );
}
