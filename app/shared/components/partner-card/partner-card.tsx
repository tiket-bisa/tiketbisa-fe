import { Card, Avatar } from "~/core/design-system/components";
import type { PartnerCardData } from "./types";

export interface PartnerCardProps {
  partner: PartnerCardData;
  onClick?: () => void;
  className?: string;
}

export function PartnerCard({
  partner,
  onClick,
  className = "",
}: PartnerCardProps) {
  return (
    <Card
      hoverable
      padding="md"
      className={`flex items-center gap-3 ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
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
        src={partner.logoUrl}
        alt={partner.name}
        fallback={partner.name.charAt(0).toUpperCase()}
        size="lg"
      />

      <div className="flex flex-col gap-0.5 min-w-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">
          {partner.name}
        </h3>
        {partner.description && (
          <p className="text-xs text-text-tertiary line-clamp-1">
            {partner.description}
          </p>
        )}
        {partner.eventCount !== undefined && (
          <p className="text-xs text-text-secondary">
            {partner.eventCount} event{partner.eventCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Card>
  );
}
