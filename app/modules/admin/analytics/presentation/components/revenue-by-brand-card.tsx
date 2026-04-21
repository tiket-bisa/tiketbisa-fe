import { Badge, Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { allRevenueByBrand } from "~/modules/admin/analytics/infrastructure/revenue.mock";

export function RevenueByBrandCard() {
  return (
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
  );
}
