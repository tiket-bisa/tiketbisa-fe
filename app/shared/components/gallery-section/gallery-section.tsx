export interface GallerySectionProps {
  images: { src: string; alt: string }[];
  title?: string;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function GallerySection({
  images,
  title,
  columns = 3,
  className = "",
}: GallerySectionProps) {
  if (images.length === 0) return null;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
  } as const;

  return (
    <section className={className}>
      {title && (
        <h3 className="mb-4 text-base font-semibold text-text-primary">
          {title}
        </h3>
      )}
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {images.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="aspect-square overflow-hidden rounded-xl bg-surface-alt"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
