import { Card, Badge } from "~/core/design-system/components";
import type { EventCardData } from "./types";

export interface EventCardProps {
  event: EventCardData;
  onClick?: () => void;
  className?: string;
}

export function EventCard({ event, onClick, className = "" }: EventCardProps) {
  return (
    <Card
      hoverable
      padding="none"
      className={className}
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
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {event.brandName && (
          <Badge variant="brand" className="absolute top-2 left-2">
            {event.brandName}
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2">
          {event.title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <svg
            className="h-3.5 w-3.5 shrink-0"
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

        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <svg
            className="h-3.5 w-3.5 shrink-0"
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
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>

        <p className="mt-1 text-sm font-semibold text-brand-primary">
          {event.priceRange}
        </p>
      </div>
    </Card>
  );
}
