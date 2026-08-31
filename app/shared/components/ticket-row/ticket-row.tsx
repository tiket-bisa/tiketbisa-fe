import { useEffect, useRef, useState, type CSSProperties } from "react";
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
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <OverflowingTicketName name={ticket.name} />
        <div>
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
        className="shrink-0"
        value={quantity}
        min={0}
        max={ticket.available ? (ticket.maxPerOrder ?? 10) : 0}
        onChange={(val) => onQuantityChange(ticket.id, val)}
      />
    </div>
  );
}

function OverflowingTicketName({ name }: { name: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const text = textRef.current;
    if (!viewport || !text) return;

    const measure = () => {
      setOverflow(Math.max(0, text.scrollWidth - viewport.clientWidth));
    };

    measure();
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(measure);
    resizeObserver?.observe(viewport);
    resizeObserver?.observe(text);
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [name]);

  const animationStyle = overflow > 0
    ? ({ "--ticket-name-overflow": `${overflow}px` } as CSSProperties)
    : undefined;

  return (
    <div ref={viewportRef} className="min-w-0 overflow-hidden" title={name}>
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap text-sm font-medium text-text-primary ${overflow > 0 ? "animate-ticket-name-scroll" : ""}`}
        style={animationStyle}
      >
        {name}
      </span>
    </div>
  );
}
