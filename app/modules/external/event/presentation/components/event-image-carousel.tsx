import { useMemo, useState } from "react";

type EventImageCarouselProps = {
  images?: string[];
  eventName: string;
};

export function EventImageCarousel({ images, eventName }: EventImageCarouselProps) {
  const gallery = useMemo(() => (images ?? []).filter(Boolean), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (gallery.length === 0) return null;

  const activeImage = gallery[Math.min(activeIndex, gallery.length - 1)] ?? gallery[0];

  return (
    <section className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-alt shadow-2xl">
        <img
          src={activeImage}
          alt={eventName}
          className="w-full aspect-video object-cover"
        />
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Gambar sebelumnya"
              onClick={() => setActiveIndex((current) => (current === 0 ? gallery.length - 1 : current - 1))}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              aria-label="Gambar berikutnya"
              onClick={() => setActiveIndex((current) => (current + 1) % gallery.length)}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/75"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Lihat gambar ${index + 1}`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition ${
                index === activeIndex ? "border-brand-primary" : "border-border-subtle opacity-70 hover:opacity-100"
              }`}
            >
              <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
