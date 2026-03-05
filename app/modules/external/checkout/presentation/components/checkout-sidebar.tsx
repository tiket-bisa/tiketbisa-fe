import { Card, Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { OrderSummary } from "../../domain/checkout.types";
import { CountdownTimer } from "./countdown-timer";

export interface CheckoutSidebarProps {
  summary: OrderSummary;
  onNext: () => void;
  isLoading?: boolean;
  className?: string;
}

export function CheckoutSidebar({ summary, onNext, isLoading, className = "" }: CheckoutSidebarProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Timer Section */}
      <CountdownTimer />

      {/* Summary Card */}
      <Card className="p-8 bg-white border-gray-100 shadow-sm rounded-3xl">
        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-primary rounded-full" />
          Rincian Pesanan
        </h2>
        
        <div className="space-y-6 mb-8">
          {summary.items.map((item) => (
            <div key={item.ticketId} className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900 leading-tight">{item.ticketName}</p>
                <p className="text-xs text-gray-500 font-medium">
                  {item.quantity}x {formatIDR(item.price)}
                </p>
              </div>
              <p className="text-sm font-extrabold text-gray-900 whitespace-nowrap">
                {formatIDR(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Subtotal</span>
            <span className="text-sm font-bold text-gray-900">{formatIDR(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Biaya Admin</span>
            <span className="text-sm font-bold text-gray-900">{formatIDR(summary.adminFee)}</span>
          </div>
          <div className="flex justify-between items-center pt-5 border-t-2 border-dashed border-gray-100 mt-2">
            <span className="text-sm font-bold text-gray-900">Total Bayar</span>
            <span className="text-xl font-black text-brand-primary">
              {formatIDR(summary.totalPrice)}
            </span>
          </div>
        </div>

        <Button
          onClick={onNext}
          isLoading={isLoading}
          className="w-full mt-10 py-7 rounded-2xl text-lg font-black shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all hover:-translate-y-0.5"
        >
          Lanjut ke Pembayaran
        </Button>
      </Card>
    </div>
  );
}
