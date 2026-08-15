import { Badge } from "~/core/design-system/components";
import type { Event } from "../../domain/event.entity";

interface EventDetailHeaderProps {
  event: Event;
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  return (
    <header className="relative w-full h-[140px] bg-text-primary md:h-[200px] overflow-hidden">
      <img
        src={event.imageUrl}
        alt={`${event.name} banner`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />
      <div className="relative z-10 mx-auto max-w-7xl h-full flex flex-col justify-end px-4 pb-6 sm:px-6 lg:px-8">
        <Badge variant="brand" className="w-fit mb-2">
          Upcoming Event
        </Badge>
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          {event.name}
        </h1>
        <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm text-white">
          <InfoItem icon="location_on" text={event.location} />
          <InfoItem icon="calendar_month" text={event.date} />
          {event.time && <InfoItem icon="schedule" text={event.time} />}
        </div>
      </div>
    </header>
  );
}

function InfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-brand-primary text-[16px]">
        {icon}
      </span>
      <span className="text-white">{text}</span>
    </div>
  );
}
