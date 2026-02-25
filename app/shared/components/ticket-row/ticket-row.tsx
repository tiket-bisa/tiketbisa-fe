import { Badge, Counter } from "~/core/design-system/components";
import type { TicketRowData } from "./types";

export interface TicketRowProps {
  ticket: TicketRowData;
  quantity: number;
  onQuantityChange: (ticketId: string, quantity: number) => void;
  formatPrice?: (price: number) => string;
  className?: string;
}

function defaultFormatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function TicketRow({
  ticket,
  quantity,
  onQuantityChange,
  formatPrice = defaultFormatPrice,
  className = "",
}: TicketRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border border-border-default bg-surface-alt px-4 py-3 ${className}`}
    >
      {/* Left: ticket info */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {ticket.name}
          </span>
          <Badge variant={ticket.available ? "success" : "destructive"}>
            {ticket.available ? "Tersedia" : "Habis Terjual"}
          </Badge>
        </div>
        <span className="text-sm font-semibold text-brand-primary">
          {formatPrice(ticket.price)}
        </span>
      </div>

      {/* Right: counter */}
      <Counter
        value={quantity}
        min={0}
        max={ticket.available ? (ticket.maxPerOrder ?? 10) : 0}
        onChange={(val) => onQuantityChange(ticket.id, val)}
      />
    </div>
  );
}
