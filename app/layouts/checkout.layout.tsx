import { Outlet, useSearchParams } from "react-router";
import { CheckoutNavbar, Footer, type CheckoutStep } from "~/shared/components";

/**
 * Checkout Layout — Trust Mode
 *
 * data-trust-mode="true" activates CSS token overrides
 * that lock --color-accent to Brand Purple (#6D5CFF)
 * and strip all dynamic club accents during payment.
 *
 * Structure: Minimal header (logo + step indicator) → <Outlet /> → Minimal footer
 */
export default function CheckoutLayout() {
  const [searchParams] = useSearchParams();
  
  // Determine current step from URL, default to 1 (Data Pesanan)
  const stepParam = Number(searchParams.get("step") || "1");
  const displayStep = (
    stepParam >= 4 ? 4 : stepParam >= 1 && stepParam <= 3 ? stepParam : 1
  ) as CheckoutStep;

  return (
    <div
      data-trust-mode="true"
      className="flex min-h-screen flex-col bg-white"
    >
      <CheckoutNavbar currentStep={displayStep} />
      
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
