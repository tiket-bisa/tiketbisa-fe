import { Outlet } from "react-router";

/**
 * Checkout Layout — Trust Mode
 *
 * data-trust-mode="true" activates CSS token overrides
 * that lock --color-accent to Brand Purple (#6D5CFF)
 * and strip all dynamic club accents during payment.
 *
 * Structure: Minimal header (logo + step indicator) → <Outlet /> → Minimal footer
 *
 * TODO: Implement step indicator, minimal header/footer
 */
export default function CheckoutLayout() {
  return (
    <div
      data-trust-mode="true"
      className="flex min-h-screen flex-col bg-[var(--color-neutral-50)]"
    >
      {/* TODO: <CheckoutHeader /> with step indicator */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      {/* TODO: <CheckoutFooter /> */}
    </div>
  );
}
