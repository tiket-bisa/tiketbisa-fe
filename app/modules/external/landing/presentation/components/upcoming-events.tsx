import { Link } from "react-router";
import { EventCard, SectionHeader, FilterBar } from "~/shared/components";
import { EVENT_FILTERS } from "../../../event/presentation/constants";
import type { Event } from "../../../event/domain/event.entity";

interface UpcomingEventsProps {
  events: Event[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  onReset: () => void;
}

export function UpcomingEvents({
  events,
  filterValues,
  onFilterChange,
  onReset,
}: UpcomingEventsProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        title="Upcoming Events"
        subtitle="Jangan lewatkan momen berharga di sekitarmu"
        action={
          <Link
            to="/event"
            className="text-sm font-semibold text-brand-primary hover:underline"
          >
            Lihat semua &rarr;
          </Link>
        }
        className="mb-6"
      />

      <div className="mb-8">
        <FilterBar
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          filters={EVENT_FILTERS}
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onReset={onReset}
          className="w-full"
        />
      </div>

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
              minPrice: event.minPrice,
              brandName: event.brand,
            }}
          />
        ))}
      </div>
    </section>
  );
}
