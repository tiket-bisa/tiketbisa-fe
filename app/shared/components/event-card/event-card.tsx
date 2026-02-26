import { useRef, useState, useEffect, useCallback } from "react";
import { Card } from "~/core/design-system/components";
import type { EventCardData } from "./types";

export interface EventCardProps {
  event: EventCardData;
  onClick?: () => void;
  className?: string;
}

export function EventCard({ event, onClick, className = "" }: EventCardProps) {
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

  return (
    <Card
      hoverable
      padding="none"
      className={`flex flex-col ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Thumbnail */}
      <div className="h-auto overflow-hidden aspect-[1062/427] w-full rounded-t-xl bg-slate-200">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="h-full w-full object-cover"
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
          <svg
            className="h-4 w-4 shrink-0 text-brand-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <span>{event.date}</span>
        </div>

        <p className="mt-2 text-lg font-bold text-text-primary">
          {event.priceRange}
        </p>

        {/* Spacer to push brand section to the bottom */}
        <div className="flex-1" />

        {/* Brand / Organizer — always pinned to bottom */}
        {event.brandName && (
          <div className="mt-3 flex items-center gap-2 border-t border-border-default pt-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-text-secondary">
              {brandInitial}
            </div>
            <span className="text-sm font-medium text-text-secondary uppercase tracking-wide truncate">
              {event.brandName}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
