import { Link } from "react-router";
import { Avatar } from "~/core/design-system/components";
import type { Event } from "../../domain/event.entity";
import { EventImageCarousel } from "./event-image-carousel";

interface EventDetailContentProps {
  event: Event;
}

/** Description, terms, and organizer info — ticket category picking lives in the sticky sidebar. */
export function EventDetailContent({ event }: EventDetailContentProps) {
  return (
    <div className="lg:col-span-2 space-y-8">
      <article className="space-y-4">
        <EventImageCarousel
          eventName={event.name}
          images={event.galleryImages?.length ? event.galleryImages : [event.imageUrl]}
        />
        <div className="prose prose-invert max-w-none">
          <h2 className="text-lg font-bold text-text-primary mb-2">Tentang Event</h2>
          <p className="text-text-secondary leading-relaxed">{event.description}</p>
        </div>
      </article>

      {event.terms && event.terms.length > 0 && (
        <section className="bg-surface-alt p-6 rounded-2xl border border-border-default">
          <h2 className="text-lg font-bold text-text-primary mb-4">Syarat &amp; Ketentuan</h2>
          <ul className="space-y-3">
            {event.terms.map((term, idx) => (
              <li key={idx} className="flex gap-3 text-text-primary text-sm">
                <span className="text-brand-primary font-bold">{idx + 1}.</span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="pt-6 border-t border-border-default">
        <h2 className="text-base font-bold text-text-primary mb-4">Penyelenggara</h2>
        <div className="group flex items-center gap-4 p-5 rounded-2xl border border-border-default bg-surface-alt hover:bg-surface-hover transition-colors">
          <Avatar
            src=""
            fallback={event.brand.charAt(0)}
            size="lg"
            className="ring-2 ring-brand-primary text-brand-primary"
          />
          <div className="flex-1">
            <h3 className="text-base font-bold text-brand-primary">{event.brand}</h3>
            <p className="text-text-tertiary text-xs mb-1">Verified Partner Tiketbisa</p>
            <Link
              to={`/brand/${event.brandId || event.brand.toLowerCase()}`}
              className="text-brand-primary hover:underline text-sm font-medium inline-flex items-center gap-1"
            >
              Lihat Profil Brand{" "}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
