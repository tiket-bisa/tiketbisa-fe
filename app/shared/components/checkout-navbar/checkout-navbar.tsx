import { Link } from "react-router";

export type CheckoutStep = 1 | 2 | 3 | 4;

export interface CheckoutNavbarProps {
  currentStep: CheckoutStep;
  className?: string;
}

const STEPS = [
  { id: 1, label: "Data Pesanan" },
  { id: 2, label: "Metode Pembayaran" },
  { id: 3, label: "Konfirmasi Pembayaran" },
  { id: 4, label: "Pembayaran" },
] as const;

/**
 * CheckoutNavbar — Multi-step indicator for checkout process.
 * Reverted to Brand Dark Theme as requested.
 */
export function CheckoutNavbar({ currentStep, className = "" }: CheckoutNavbarProps) {
  return (
    <header className={`sticky top-0 z-50 border-b border-white/5 bg-surface-primary ${className}`}>
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div className="flex shrink-0 items-center">
          <Link to="/" aria-label="Tiketbisa home">
            <img
              src="/logo/tiketbisa-white.png"
              alt="Tiketbisa"
              className="h-8 w-auto lg:h-12"
            />
          </Link>
        </div>

        {/* Desktop Step Indicator */}
        <div className="hidden flex-1 items-center justify-center px-8 md:flex">
          <ol className="flex w-full max-w-3xl items-center gap-2">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <li key={step.id} className="flex flex-1 items-center last:flex-none">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                        isActive
                          ? "border-brand-primary bg-brand-primary text-white shadow-[0_0_15px_rgba(109,92,255,0.4)] scale-110"
                          : isCompleted
                          ? "border-brand-primary/50 bg-brand-primary/20 text-brand-primary"
                          : "border-white/10 text-text-tertiary bg-white/5"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </span>
                    <span
                      className={`text-sm font-bold whitespace-nowrap transition-colors ${
                        isActive ? "text-white" : "text-text-tertiary"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`mx-4 h-[2px] flex-1 min-w-[30px] rounded-full transition-all duration-500 ${
                        isCompleted ? "bg-brand-primary/50" : "bg-white/5"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile Step Status */}
        <div className="flex flex-col items-end md:hidden">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            Langkah {currentStep} / 4
          </span>
          <span className="text-sm font-extrabold text-white">
            {STEPS.find((s) => s.id === currentStep)?.label}
          </span>
        </div>
      </nav>
    </header>
  );
}
