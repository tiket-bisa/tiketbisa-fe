import { Card, Avatar } from "~/core/design-system/components";
import type { BrandCardData } from "./types";

export interface BrandCardProps {
  brand: BrandCardData;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function BrandCard({
  brand,
  selected = false,
  onClick,
  className = "",
}: BrandCardProps) {
  return (
    <Card
      hoverable
      padding="md"
      className={`flex flex-col items-center gap-3 text-center ${
        selected ? "ring-2 ring-brand-primary border-brand-primary" : ""
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? selected : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <Avatar
        src={brand.logoUrl}
        alt={brand.name}
        fallback={brand.name.charAt(0).toUpperCase()}
        size="xl"
      />
      <span className="text-sm font-medium text-text-primary truncate w-full">
        {brand.name}
      </span>
    </Card>
  );
}
