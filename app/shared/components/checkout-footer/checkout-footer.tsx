export interface CheckoutFooterProps {
  className?: string;
}

/**
 * CheckoutFooter — Minimalist footer for Trust Mode checkout.
 */
export function CheckoutFooter({ className = "" }: CheckoutFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t border-border-default bg-surface-primary py-8 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-text-tertiary">
            &copy; {currentYear} Tiketbisa. Semua hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-6">
            <a href="/syarat-ketentuan" className="text-xs font-medium text-text-tertiary hover:text-white transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="/kebijakan-privasi" className="text-xs font-medium text-text-tertiary hover:text-white transition-colors">
              Kebijakan Privasi
            </a>
            <a href="/bantuan" className="text-xs font-medium text-text-tertiary hover:text-white transition-colors">
              Pusat Bantuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
