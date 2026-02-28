import { Badge } from "~/core/design-system/components";
import type { Event } from "../../domain/event.entity";

interface EventDetailHeaderProps {
  event: Event;
}

export function EventDetailHeader({ event }: EventDetailHeaderProps) {
  return (
    <header className="relative w-full h-[300px] md:h-[450px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{
          backgroundImage: `url(${event.imageUrl})`,
          filter: "blur(30px) brightness(0.6)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-7xl h-full flex flex-col justify-end px-4 pb-12 sm:px-6 lg:px-8">
        <Badge variant="brand" className="w-fit mb-4">
          Upcoming Event
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          {event.name}
        </h1>
        <div className="flex flex-wrap gap-4 md:gap-8 text-sm md:text-lg text-white">
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
      <span className="material-symbols-outlined text-brand-primary text-[20px]">
        {icon}
      </span>
      <span>{text}</span>
    </div>
  );
}
