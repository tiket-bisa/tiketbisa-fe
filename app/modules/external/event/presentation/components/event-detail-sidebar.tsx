import { Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import type { Event } from "../../domain/event.entity";

interface EventDetailSidebarProps {
  event: Event;
  totalPrice?: number;
  onCheckout?: () => void;
}

/**
 * Sidebar component for Event Detail page.
 */
export function EventDetailSidebar({
  event,
  totalPrice = 0,
  onCheckout,
}: EventDetailSidebarProps) {
  const hasSelectedTickets = totalPrice > 0;

  // Derive the starting price from the ticket list
  const minPrice =
    event.tickets.length > 0
      ? Math.min(...event.tickets.map((t) => t.price))
      : 0;

  return (
    <aside className="lg:col-span-1">
      <div className="sticky top-24 rounded-2xl border border-border-default bg-surface-alt p-8 space-y-8">
        <h2 className="text-2xl font-extrabold text-black leading-tight">
          {event.name}
        </h2>

        <div className="space-y-6">
          <SidebarInfo
            icon="location_on"
            label="Lokasi"
            value={event.location}
          />
          <SidebarInfo
            icon="calendar_month"
            label="Waktu"
            value={`${event.date} • ${event.time || ""}`}
          />
          <SidebarInfo
            icon="confirmation_number"
            label="Penyelenggara"
            value={event.brand}
          />
        </div>

        <div className="pt-6 border-t border-border-default">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <PriceDisplay
              isTotal={hasSelectedTickets}
              amount={hasSelectedTickets ? totalPrice : minPrice}
            />

            {hasSelectedTickets && (
              <div className="hidden lg:block animate-in fade-in slide-in-from-right-4 duration-300">
                <Button
                  className="px-8 py-4 text-base font-bold whitespace-nowrap shadow-none border-2 border-brand-primary hover:border-brand-primary-hover"
                  onClick={onCheckout}
                  variant="primary"
                >
                  Beli Tiket
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarInfo({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="bg-brand-primary/10 p-2.5 rounded-xl group-hover:bg-brand-primary/20 transition-colors">
        <span className="material-symbols-outlined text-brand-primary">
          {icon}
        </span>
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] text-text-tertiary uppercase tracking-[0.2em] font-black">
          {label}
        </p>
        <p className="text-black font-semibold leading-relaxed">
          {value}
        </p>
      </div>
    </div>
  );
}

function PriceDisplay({ isTotal, amount }: { isTotal: boolean; amount: number }) {
  const label = isTotal ? "Total harga tiket" : "Harga mulai dari";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-text-tertiary font-medium">{label}</p>
      <p className="text-2xl xl:text-3xl font-black text-brand-primary tracking-tight">
        {formatIDR(amount)}
      </p>
    </div>
  );
}
