import { Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { OrderSummary } from "../../../domain/checkout.types";
import { formatServiceFeeBreakdown } from "../../../domain/checkout.pricing";

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
          <span className="text-sm font-medium text-text-secondary">Sub total</span>
          <span className="text-sm font-bold text-text-primary">{formatIDR(summary.subtotal)}</span>
        </div>

        {summary.serviceFee > 0 && (
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="block text-sm font-medium text-text-secondary">Biaya layanan</span>
              <span className="block text-xs font-medium text-text-tertiary">{formatServiceFeeBreakdown(summary)}</span>
            </div>
            <span className="text-sm font-bold text-text-primary whitespace-nowrap">{formatIDR(summary.serviceFee)}</span>
          </div>
        )}

        {summary.transactionFee > 0 && (
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="block text-sm font-medium text-text-secondary">Biaya transaksi (payment gateway)</span>
              {summary.transactionFeeDescription && (
                <span className="block text-xs font-medium text-text-tertiary">{summary.transactionFeeDescription}</span>
              )}
            </div>
            <span className="text-sm font-bold text-text-primary whitespace-nowrap">{formatIDR(summary.transactionFee)}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-5 border-t-2 border-dashed border-gray-100 mt-2">
          <span className="text-sm font-bold text-text-primary">Total</span>
          <span className="text-xl font-black text-brand-primary">
            {formatIDR(summary.totalPrice)}
          </span>
        </div>
      </div>
    </Card>
  );
}
