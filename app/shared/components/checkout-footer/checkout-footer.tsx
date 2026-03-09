export interface CheckoutFooterProps {
  className?: string;
}

/**
 * CheckoutFooter — Minimalist footer for White Theme.
 */
export function CheckoutFooter({ className = "" }: CheckoutFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`border-t border-gray-100 bg-gray-50/50 py-10 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center md:items-start gap-2">
             <img
              src="/logo/tiketbisa.png"
              alt="Tiketbisa"
              className="h-6 w-auto grayscale opacity-50 mb-2"
            />
            <p className="text-sm text-gray-500 font-medium">
              &copy; {currentYear} Tiketbisa. Semua hak cipta dilindungi.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4">
            <a href="/syarat-ketentuan" className="text-sm font-semibold text-gray-400 hover:text-brand-primary transition-colors">
              Syarat & Ketentuan
            </a>
            <a href="/kebijakan-privasi" className="text-sm font-semibold text-gray-400 hover:text-brand-primary transition-colors">
              Kebijakan Privasi
            </a>
            <a href="/bantuan" className="text-sm font-semibold text-gray-400 hover:text-brand-primary transition-colors">
              Pusat Bantuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
