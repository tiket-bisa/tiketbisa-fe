import type { Event } from "../../../event/domain/event.entity";

export interface EventInfoHeaderProps {
  event: Event;
  className?: string;
}

export function EventInfoHeader({ event, className = "" }: EventInfoHeaderProps) {
  return (
    <div className={`space-y-2 animate-in fade-in slide-in-from-bottom-6 duration-700 ${className}`}>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
        {event.name}
      </h1>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-bold text-gray-500 flex items-center gap-2">
          <span>{event.date}</span>
          {event.time && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{event.time}</span>
            </>
          )}
        </p>
        <p className="text-sm font-bold text-gray-500">
          {event.location}
        </p>
      </div>
    </div>
  );
}
