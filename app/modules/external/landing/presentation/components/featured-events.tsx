import { useCallback, useState } from "react";
import { Link } from "react-router";
import { SectionHeader } from "~/shared/components";
import { Badge, Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { Event } from "../../../event/domain/event.entity";

interface FeaturedEventsProps {
  events: Event[];
}

/** One event per slide, image beside the description — swipe/click through via the arrows or dots. */
export function FeaturedEvents({ events }: FeaturedEventsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const maxIndex = Math.max(0, events.length - 1);

  const next = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  if (!events || events.length === 0) return null;

  return (
    <section className="bg-brand-primary py-12 overflow-hidden relative text-base-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <SectionHeader title="Featured Event" className="mb-0 text-base-white font-bold" />
            <p className="mt-1 text-sm text-base-white font-medium opacity-90">
              Event pilihan yang akan datang untukmu
            </p>
          </div>
          <Link
            to="/event"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-base-white/90 hover:text-base-white whitespace-nowrap"
          >
            Lihat Semua Event
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="relative group/featured">
          {events.length > 1 && (
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-30">
              <button
                onClick={prev}
                disabled={currentIndex === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-base-white shadow-2xl pointer-events-auto transition-all hover:bg-white hover:text-brand-primary disabled:opacity-0"
                aria-label="Event sebelumnya"
              >
                <span className="material-symbols-outlined text-[22px]">chevron_left</span>
              </button>
              <button
                onClick={next}
                disabled={currentIndex >= maxIndex}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-base-white shadow-2xl pointer-events-auto transition-all hover:bg-white hover:text-brand-primary disabled:opacity-0"
                aria-label="Event berikutnya"
              >
                <span className="material-symbols-outlined text-[22px]">chevron_right</span>
              </button>
            </div>
          )}

          {/* Inset from the group edges (rather than pushing the arrows further out) so the
              h-10 w-10 arrow buttons sit beside the card instead of overlapping it. */}
          <div className="overflow-hidden rounded-2xl mx-12 sm:mx-14">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {events.map((event) => (
                <div key={event.id} className="w-full shrink-0">
                  <FeaturedEventSlide event={event} />
                </div>
              ))}
            </div>
          </div>

          {events.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {events.map((event, idx) => (
                <button
                  key={event.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Ke event ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentIndex ? "w-6 bg-base-white" : "w-1.5 bg-base-white/40 hover:bg-base-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedEventSlide({ event }: { event: Event }) {
  const isSoldOut = event.tickets.length > 0 && event.tickets.every((t) => !t.available);

  return (
    <Link
      to={`/event/${event.id}`}
      className="grid grid-cols-1 md:grid-cols-[2fr_1fr] rounded-2xl overflow-hidden bg-surface-primary text-text-primary shadow-2xl"
    >
      <div className="aspect-video md:aspect-auto md:h-full bg-surface-alt">
        <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-col justify-center gap-2 p-5 md:p-6">
        <Badge variant={isSoldOut ? "destructive" : "success"} className="w-fit">
          {isSoldOut ? "Habis Terjual" : "Tiket Tersedia"}
        </Badge>
        <h3 className="text-base md:text-lg font-bold tracking-tight line-clamp-2">{event.name}</h3>

        <div className="flex flex-col gap-1 text-xs text-text-secondary">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-brand-primary text-[14px]">location_on</span>
            <span className="truncate">{event.location}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-brand-primary text-[14px]">calendar_month</span>
            <span className="truncate">{event.date}</span>
          </span>
        </div>

        {event.description && (
          <p className="text-xs text-text-secondary line-clamp-2">{event.description}</p>
        )}

        <div className="mt-1 flex flex-col gap-2">
          {event.minPrice != null && (
            <div>
              <p className="text-[11px] text-text-tertiary">Harga mulai dari</p>
              <p className="text-base font-black text-brand-primary">{formatIDR(event.minPrice)}</p>
            </div>
          )}
          <Button variant="primary" className="px-4 py-2 text-xs font-bold whitespace-nowrap w-fit">
            Lihat Detail
          </Button>
        </div>
      </div>
    </Link>
  );
}
