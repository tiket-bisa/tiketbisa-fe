import { Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { OrderSummary } from "../../domain/checkout.types";

export interface OrderSummaryCardProps {
  summary: OrderSummary;
  className?: string;
}

export function OrderSummaryCard({ summary, className = "" }: OrderSummaryCardProps) {
  return (
    <Card className={`p-6 md:p-8 bg-white border-gray-100 shadow-sm rounded-3xl ${className}`}>
      <h2 className="text-xl font-black text-text-primary mb-8 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-brand-primary rounded-full" />
        Rincian Pesanan
      </h2>
      
      <div className="space-y-6 mb-8">
        {summary.items.map((item) => (
          <div key={item.ticketId} className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-text-primary leading-tight">{item.ticketName}</p>
              <p className="text-xs text-text-secondary font-medium">
                {item.quantity}x {formatIDR(item.price)}
              </p>
            </div>
            <p className="text-sm font-extrabold text-text-primary whitespace-nowrap">
              {formatIDR(item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-gray-50 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-text-secondary">Subtotal</span>
          <span className="text-sm font-bold text-text-primary">{formatIDR(summary.subtotal)}</span>
        </div>
        
        {summary.tax > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-secondary">Pajak Daerah</span>
            <span className="text-sm font-bold text-text-primary">{formatIDR(summary.tax)}</span>
          </div>
        )}

        {summary.serviceFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-text-secondary">Biaya Layanan</span>
            <span className="text-sm font-bold text-text-primary">{formatIDR(summary.serviceFee)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-5 border-t-2 border-dashed border-gray-100 mt-2">
          <span className="text-sm font-bold text-text-primary">Total Bayar</span>
          <span className="text-xl font-black text-brand-primary">
            {formatIDR(summary.totalPrice)}
          </span>
        </div>
      </div>
    </Card>
  );
}
