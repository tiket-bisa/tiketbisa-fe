import { useCarousel } from "./hooks/use-carousel";
import { useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    currentNode,
    window: displaySlides,
    isTransitioning,
    isAnimating,
    direction,
    next,
    prev,
    goTo,
    handleTransitionEnd,
    setIsPaused,
  } = useCarousel(slides, { autoPlay, interval });

  if (!slides || slides.length === 0) return null;

  /**
   * Layout Logic for Infinite Effect:
   * We render a window of 5 items. The center (index 2) is always the 'Current'.
   * When animating next, we move towards index 3.
   * On transition end, we shift the window and reset the transform to index 2 instantly.
   */
  
  let currentOffset = -200;
  let gapOffset = -2;

  if (direction === "next" && isTransitioning) {
    currentOffset = -300;
    gapOffset = -3;
  } else if (direction === "prev" && isTransitioning) {
    currentOffset = -100;
    gapOffset = -1;
  }

  const mobileActiveIndex = isTransitioning
    ? (direction === "next" ? 3 : 1)
    : 2;
  const transform = isMobile ? undefined : `translate3d(calc(${currentOffset}% + ${gapOffset}rem), 0, 0)`;

  return (
    <section
      className={`group relative w-full overflow-hidden py-4 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Promotional Banners"
    >
      <div 
        className="relative w-full overflow-visible px-4 md:px-12 lg:px-24" 
      >
        {/* Main Slider Track */}
        <ul 
          className="flex list-none p-0 m-0"
          style={{ 
            transition: isTransitioning ? "transform 600ms cubic-bezier(0.25, 1, 0.5, 1)" : "none",
            transform,
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
{displaySlides.map((node, i) => {
            const slide = node.value;
            const isActive = (direction === "next" && i === 3) ||
                           (direction === "prev" && i === 1) ||
                           (!direction && i === 2);

            return (
              <li
                key={`${slide.id}-${node.index}-${i}`}
                className={`flex-none rounded-2xl overflow-hidden transition-all duration-500 ease-out ${
                  isMobile
                    ? `w-full ${isActive ? "opacity-100" : "opacity-0 absolute pointer-events-none"}`
                    : `w-full mr-4 ${isActive ? "opacity-100 scale-100 shadow-xl" : "opacity-40 scale-[0.92] blur-[1px]"}`
                }`}
                role="group"
                aria-roledescription="slide"
              >
                <div className="relative w-full overflow-hidden rounded-2xl group/slide md:h-full md:overflow-visible md:rounded-none">
                  <img
                    src={slide.imageUrl}
                    alt={slide.alt || "Banner"}
                    className="aspect-[16/9] min-h-[150px] w-full rounded-2xl object-cover select-none transition-transform duration-700 group-hover/slide:scale-105 sm:min-h-[190px] md:aspect-auto md:h-auto md:min-h-0"
                    draggable={false}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                </div>
              </li>
            );
          })}
        </ul>

        {/* Global Navigation Buttons — Visible only on Hover */}
        <div className="absolute inset-y-0 left-2 right-2 md:left-[8.5rem] md:right-[8.5rem] flex items-center justify-between pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            type="button"
            onClick={prev}
            disabled={isAnimating}
            aria-label="Previous slide"
            className="bg-white/95 p-4 rounded-full shadow-2xl pointer-events-auto transform transition-all hover:scale-110 active:scale-90 disabled:opacity-50 border border-gray-100 text-text-primary hover:bg-white flex items-center justify-center group/btn"
          >
            <svg className="w-6 h-6 transition-transform group-hover/btn:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            disabled={isAnimating}
            aria-label="Next slide"
            className="bg-white/95 p-4 rounded-full shadow-2xl pointer-events-auto transform transition-all hover:scale-110 active:scale-90 disabled:opacity-50 border border-gray-100 text-text-primary hover:bg-white flex items-center justify-center group/btn"
          >
            <svg className="w-6 h-6 transition-transform group-hover/btn:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {slides.length > 1 && (
        <nav className="flex items-center justify-center gap-3 mt-8" aria-label="Carousel Pagination">
          {slides.map((_, i) => {
            let activeDotIndex = currentNode?.index ?? 0;
            if (isTransitioning) {
              activeDotIndex = direction === "next" ? activeDotIndex + 1 : direction === "prev" ? activeDotIndex - 1 : activeDotIndex;
              if (activeDotIndex < 0) activeDotIndex = slides.length - 1;
              if (activeDotIndex >= slides.length) activeDotIndex = 0;
            }
            const isActiveDot = activeDotIndex === i;

            return (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                disabled={isAnimating}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={isActiveDot ? "true" : "false"}
                className={`h-2.5 rounded-full cursor-pointer disabled:cursor-not-allowed ${
                  isMobile ? "transition-none" : "transition-all duration-500"
                } ${isActiveDot ? "w-12 bg-brand-primary" : "w-2.5 bg-gray-300 hover:bg-brand-primary/40"}`}
              />
            );
          })}
        </nav>
      )}
    </section>
  );
}
