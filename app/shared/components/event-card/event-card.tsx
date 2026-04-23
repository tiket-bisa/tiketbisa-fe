import { Link } from "react-router";
import { Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import type { EventCardProps } from "./types";

export function EventCard({ event, className = "" }: EventCardProps) {
  const brandInitial = event.brandName
    ? event.brandName.charAt(0).toUpperCase()
    : "";

  const minPrice =
    event.tickets.length > 0
      ? Math.min(...event.tickets.map((t: { price: number }) => t.price))
      : event.minPrice;

  const isLongTitle = event.title.length > 27;

  return (
    <Link to={`/event/${event.id}`} className="block group">
      <Card
        hoverable
        padding="none"
        className={`flex flex-col h-full ${className}`}
      >
        <div className="h-auto overflow-hidden aspect-[1062/427] w-full rounded-t-xl bg-slate-200">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="relative overflow-hidden">
            <h3
              className={`text-lg font-semibold text-text-primary leading-snug whitespace-nowrap inline-block ${isLongTitle ? "group-hover:animate-scroll-left-text" : ""}`}
            >
              <span>{event.title}</span>
              {isLongTitle && (
                <span
                  className="pl-8 hidden group-hover:inline-block"
                  aria-hidden="true"
                >
                  {event.title}
                </span>
              )}
            </h3>

            {isLongTitle && (
              <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-l from-surface-alt to-transparent group-hover:hidden" />
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-sm text-text-tertiary">
            <span className="material-symbols-outlined text-brand-primary text-[18px]">
              calendar_month
            </span>
            <span>{event.date}</span>
          </div>

          <div className="mt-2 flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">
              Mulai dari
            </span>
            <p className="text-lg font-bold text-text-primary">
              {minPrice === undefined ? "Segera diumumkan" : formatIDR(minPrice)}
            </p>
          </div>

          <div className="flex-1" />

          {event.brandName && (
            <div className="mt-3 flex items-center gap-2 border-t border-border-default pt-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-text-secondary">
                {brandInitial}
              </div>
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] truncate">
                {event.brandName}
              </span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}