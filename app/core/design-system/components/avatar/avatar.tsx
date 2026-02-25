import type { ImgHTMLAttributes } from "react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "width" | "height"
> {
  size?: AvatarSize;
  fallback?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function Avatar({
  size = "md",
  fallback,
  src,
  alt = "",
  className = "",
  ...props
}: AvatarProps) {
  if (!src && fallback) {
    return (
      <div
        className={`inline-flex items-center justify-center rounded-full bg-brand-primary-subtle text-brand-primary font-medium ${sizeClasses[size]} ${className}`}
        role="img"
        aria-label={alt}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`inline-block rounded-full object-cover bg-surface-hover ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
