import { Link } from "react-router";
import { EventCard, SectionHeader } from "~/shared/components";
import type { Event } from "../../../event/domain/event.entity";

interface PastEventsProps {
  events: Event[];
  className?: string;
}

/**
 * PastEvents section displays a curated archive/portfolio of successfully held events
 * on the landing page. If no past events exist, it gracefully renders nothing.
 */
export function PastEvents({ events, className = "" }: PastEventsProps) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <section className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      <SectionHeader
        title="Kilas Balik Event"
        subtitle="Jejak momen berharga dan keseruan event yang telah sukses diselenggarakan"
        action={
          <Link
            to="/event?tab=lalu"
            className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1"
          >
            <span>Lihat semua arsip</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        }
        className="mb-6"
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={{
              id: event.id,
              title: event.name,
              imageUrl: event.imageUrl,
              date: event.date,
              location: event.location,
              tickets: event.tickets,
              lifecycleStatus: "ENDED",
              minPrice: event.minPrice,
              brandName: event.brand,
              brandLogoUrl: event.brandLogoUrl,
            }}
          />
        ))}
      </div>
    </section>
  );
}
