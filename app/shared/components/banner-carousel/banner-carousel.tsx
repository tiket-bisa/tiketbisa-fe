import { useState, useCallback, useEffect } from "react";
import type { BannerSlide } from "./types";

export interface BannerCarouselProps {
  slides: BannerSlide[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
}

export function BannerCarousel({
  slides,
  autoPlay = true,
  interval = 5000,
  className = "",
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (index: number) =>
      setCurrent(((index % slides.length) + slides.length) % slides.length),
    [slides.length],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const timer = setInterval(next, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, next, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      aria-roledescription="carousel"
      aria-label="Banner carousel"
    >
      {/* Slide */}
      <div className="relative aspect-[21/9] w-full bg-surface-alt">
        {slide.href ? (
          <a href={slide.href} className="block h-full w-full">
            <img
              src={slide.imageUrl}
              alt={slide.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </a>
        ) : (
          <img
            src={slide.imageUrl}
            alt={slide.alt}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}

        {/* Text overlay */}
        {(slide.title || slide.description || slide.priceRange) && (
          <div className="absolute inset-0 bg-gradient-to-t from-base-inverse/80 via-base-inverse/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
            {slide.title && (
              <h2 className="text-lg sm:text-2xl font-bold text-base-white">
                {slide.title}
              </h2>
            )}
            {slide.description && (
              <p className="mt-1 text-sm text-base-white/80 line-clamp-2 max-w-lg">
                {slide.description}
              </p>
            )}
            {slide.priceRange && (
              <p className="mt-2 text-sm font-semibold text-brand-secondary">
                {slide.priceRange}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Nav arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-base-inverse/50 text-base-white flex items-center justify-center hover:bg-base-inverse/70 transition-colors cursor-pointer"
            aria-label="Previous slide"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-base-inverse/50 text-base-white flex items-center justify-center hover:bg-base-inverse/70 transition-colors cursor-pointer"
            aria-label="Next slide"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                i === current
                  ? "w-6 bg-brand-primary"
                  : "w-2 bg-base-white/50 hover:bg-base-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
