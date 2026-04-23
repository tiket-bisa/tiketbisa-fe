import { useState, useCallback } from "react";
import { Link } from "react-router";
import { EventCard, SectionHeader } from "~/shared/components";
import { Card } from "~/core/design-system/components";
import type { Event } from "../../../event/domain/event.entity";

interface FeaturedEventsProps {
  events: Event[];
}

export function FeaturedEvents({ events }: FeaturedEventsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Logic: 4 cards per view on desktop
  const itemsPerPage = 4; 
  const totalSlides = events.length + 1; // +1 for "View All" card
  const maxIndex = Math.max(0, totalSlides - itemsPerPage);

  const next = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  if (!events || events.length === 0) return null;

  return (
    <section className="bg-brand-primary text-white py-16 overflow-hidden relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative group/featured">
        
        {/* Header Section — Featured Event White */}
        <div className="mb-10 text-center sm:text-left">
          <SectionHeader 
            title="Featured Event" 
            className="mb-0 text-white font-bold" 
          />
          <p className="mt-2 text-base text-white font-medium max-w-2xl opacity-90">
            Pilihan event terbaik minggu ini hanya untukmu
          </p>
        </div>

        <div className="relative">
          {/* Stepper Navigation — Side Buttons with Glassmorphism */}
          <div className="absolute inset-y-0 -left-6 -right-6 flex items-center justify-between pointer-events-none z-30 opacity-0 group-hover/featured:opacity-100 transition-opacity duration-300">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white shadow-2xl pointer-events-auto transition-all hover:bg-white hover:text-brand-primary disabled:opacity-0 group/btn"
              aria-label="Previous events"
            >
              <span className="material-symbols-outlined text-[24px] transition-transform group-hover/btn:-translate-x-0.5">chevron_left</span>
            </button>
            <button
              onClick={next}
              disabled={currentIndex >= maxIndex}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white shadow-2xl pointer-events-auto transition-all hover:bg-white hover:text-brand-primary disabled:opacity-0 group/btn"
              aria-label="Next events"
            >
              <span className="material-symbols-outlined text-[24px] transition-transform group-hover/btn:translate-x-0.5">chevron_right</span>
            </button>
          </div>

          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out gap-5"
              style={{ 
                transform: `translateX(calc(-${currentIndex * (100 / itemsPerPage)}% - ${currentIndex * (20 / itemsPerPage)}rem))` 
              }}
            >
              {events.map((event) => (
                <div 
                  key={event.id}
                  className="w-full shrink-0 sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.833rem)] lg:w-[calc(25%-0.9375rem)]"
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
                    className="shadow-2xl border-none"
                  />
                </div>
              ))}
              
              {/* View All Card with Refined Glassmorphism Style */}
              <div className="w-full shrink-0 sm:w-[calc(50%-0.625rem)] md:w-[calc(33.333%-0.833rem)] lg:w-[calc(25%-0.9375rem)]">
                <Link to="/event" className="block h-full group">
                  <Card
                    hoverable
                    className="flex h-full flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/20 backdrop-blur-sm"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 p-6 text-white text-center">
                      <div className="rounded-full bg-white/10 p-4 transition-transform group-hover:scale-110 group-hover:bg-white group-hover:text-brand-primary">
                        <span className="material-symbols-outlined text-[36px]">
                          arrow_forward
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-lg font-bold block">
                          Lihat Semua Event
                        </span>
                        <p className="text-xs text-slate-300/80 uppercase tracking-widest font-semibold">
                          Explore More
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
