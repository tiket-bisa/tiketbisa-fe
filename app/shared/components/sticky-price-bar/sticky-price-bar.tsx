import { Button } from "~/core/design-system/components";

export interface StickyPriceBarProps {
  totalPrice: number;
  onCheckout: () => void;
  disabled?: boolean;
  formatPrice?: (price: number) => string;
  className?: string;
}

function defaultFormatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}

export function StickyPriceBar({
  totalPrice,
  onCheckout,
  disabled = false,
  formatPrice = defaultFormatPrice,
  className = "",
}: StickyPriceBarProps) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-surface-primary/95 backdrop-blur-sm ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col">
          <span className="text-xs text-text-tertiary">Total harga tiket</span>
          <span className="text-base font-bold text-text-primary">
            {formatPrice(totalPrice)}
          </span>
        </div>

        <Button onClick={onCheckout} disabled={disabled || totalPrice <= 0}>
          Beli Tiket
        </Button>
      </div>
    </div>
  );
}
