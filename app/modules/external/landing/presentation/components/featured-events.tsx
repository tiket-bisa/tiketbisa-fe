import { useRef } from "react";
import { Link } from "react-router";
import { EventCard, SectionHeader } from "~/shared/components";
import { Card } from "~/core/design-system/components";
import type { Event } from "../../../event/domain/event.entity";

interface FeaturedEventsProps {
  events: Event[];
}

export function FeaturedEvents({ events }: FeaturedEventsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "previous" | "next") => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = Math.min(container.clientWidth * 0.9, 420);
    container.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  if (!events || events.length === 0) return null;

  return (
    <section className="bg-brand-primary py-16 overflow-hidden relative text-base-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative group/featured">
        
        {/* Header Section — Featured Event White */}
        <div className="mb-10 text-center sm:text-left">
          <SectionHeader 
            title="Featured Event" 
            className="mb-0 text-base-white font-bold" 
          />
          <p className="mt-2 text-base text-base-white font-medium max-w-2xl opacity-90">
            Pilihan event terbaik minggu ini hanya untukmu
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 -left-3 -right-3 hidden items-center justify-between pointer-events-none z-30 md:flex md:opacity-0 md:group-hover/featured:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => scroll("previous")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-base-white shadow-2xl pointer-events-auto transition-all hover:bg-white hover:text-brand-primary disabled:opacity-0 group/btn"
              aria-label="Previous events"
            >
              <span className="material-symbols-outlined text-[24px] transition-transform group-hover/btn:-translate-x-0.5">chevron_left</span>
            </button>
            <button
              onClick={() => scroll("next")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-base-white shadow-2xl pointer-events-auto transition-all hover:bg-white hover:text-brand-primary disabled:opacity-0 group/btn"
              aria-label="Next events"
            >
              <span className="material-symbols-outlined text-[24px] transition-transform group-hover/btn:translate-x-0.5">chevron_right</span>
            </button>
          </div>

          <div
            ref={scrollRef}
            className="relative -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          >
            {events.map((event) => (
              <div 
                key={event.id}
                className="w-[82vw] max-w-[360px] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.833rem)] lg:w-[calc(25%-0.9375rem)]"
              >
                <EventCard
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
                  className="h-full shadow-2xl border-none"
                />
              </div>
            ))}
            
            <div className="w-[82vw] max-w-[360px] shrink-0 snap-start sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.833rem)] lg:w-[calc(25%-0.9375rem)]">
              <Link to="/event" className="block h-full group">
                <Card
                  hoverable
                  className="flex h-full min-h-[360px] flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/20 backdrop-blur-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className="rounded-full bg-white/10 p-4 transition-transform group-hover:scale-110 group-hover:bg-white group-hover:text-brand-primary">
                      <span className="material-symbols-outlined text-[36px]">
                        arrow_forward
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-lg font-bold block">
                        Lihat Semua Event
                      </span>
                      <p className="text-xs text-base-white/80 uppercase tracking-widest font-semibold">
                        Explore More
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
          <div className="mt-2 flex justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => scroll("previous")}
              aria-label="Previous events"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-base-white"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => scroll("next")}
              aria-label="Next events"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-base-white"
            >
              <span className="material-symbols-outlined text-[22px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
