import type { TransactionTicketDetail } from "~/core/api/services/transaction.api";
import { formatIDR } from "~/core/utils";

interface TransactionTicketSummaryProps {
  ticketDetails: TransactionTicketDetail[];
  totalPrice: number;
  discountAmount?: number | null;
}

export function TransactionTicketSummary({
  ticketDetails,
  totalPrice,
  discountAmount,
}: TransactionTicketSummaryProps) {
  return (
    <>
      <div className="space-y-3">
        {ticketDetails.length === 0 && (
          <p className="text-sm text-text-tertiary">Belum ada tiket pada transaksi ini.</p>
        )}

        {ticketDetails.map((item) => (
          <div key={item.category.id} className="border border-border-subtle rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-text-primary font-semibold">{item.category.name}</p>
                <p className="text-sm text-text-tertiary">Qty: {item.ticketCount}</p>
              </div>
              <p className="text-text-primary font-bold">{formatIDR(item.subtotalPrice)}</p>
            </div>
          </div>
        ))}
      </div>

      {Boolean(discountAmount && discountAmount > 0) && (
        <div className="mt-4 flex items-center justify-between text-success">
          <span className="font-medium">Diskon promo</span>
          <span className="font-semibold">-{formatIDR(discountAmount ?? 0)}</span>
        </div>
      )}

      <div className="border-t border-border-subtle mt-4 pt-4 flex items-center justify-between">
        <span className="text-text-primary font-semibold">Total Pembayaran</span>
        <span className="text-text-primary font-bold text-lg">{formatIDR(totalPrice)}</span>
      </div>
    </>
  );
}
