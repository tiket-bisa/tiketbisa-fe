import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import type { EventCardProps } from "./types";

export function EventCard({ event, className = "" }: EventCardProps) {
  const brandInitial = event.brandName
    ? event.brandName.charAt(0).toUpperCase()
    : "";

  const titleRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const checkOverflow = useCallback(() => {
    requestAnimationFrame(() => {
      const titleEl = titleRef.current;
      const containerEl = containerRef.current;
      if (titleEl && containerEl) {
        setIsOverflowing(titleEl.scrollWidth > containerEl.clientWidth);
      }
    });
  }, []);

  useEffect(() => {
    checkOverflow();

    const containerEl = containerRef.current;
    if (!containerEl) return;

    const observer = new ResizeObserver(() => checkOverflow());
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [event.title, checkOverflow]);

  const minPrice =
    event.tickets.length > 0
      ? Math.min(...event.tickets.map((t) => t.price))
      : 0;

  return (
    <Link to={`/event/${event.id}`} className="block group">
      <Card hoverable padding="none" className={`flex flex-col h-full ${className}`}>
        {/* Thumbnail */}
        <div className="h-auto overflow-hidden aspect-[1062/427] w-full rounded-t-xl bg-slate-200">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-4">
          <div ref={containerRef} className="overflow-hidden">
            <h3
              className={`text-base font-semibold text-text-primary leading-snug whitespace-nowrap ${
                isOverflowing ? "animate-scroll-left-text" : ""
              }`}
            >
              <span ref={titleRef}>{event.title}</span>
              {isOverflowing && (
                <span className="pl-8" aria-hidden="true">
                  {event.title}
                </span>
              )}
            </h3>
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
              {formatIDR(minPrice)}
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
