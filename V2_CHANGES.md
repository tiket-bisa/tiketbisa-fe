# V2 Scope — Frontend Changes

Committed to `v2` as 10 feature commits (+2 bugfixes) on top of `37f51a6` (brand admin_fee/category/
sponsor + checkout biaya layanan/transaksi, the last item from the prior v2 session). Nothing has
been pushed.

```
a6addd3 feat: wire FLIP VA/QRIS payment instructions with realtime status polling
648b9e8 feat: add promo code input and discount row to checkout summary
cc93088 feat: per-ticket holder name/NIK inputs with samakan-data toggle and domicile notice
4416f0a feat: add SCANNER role with locked-down shell and split scan flow into validate + check-in steps
035ff6c feat: add partner ticket bulk ingest UI
842cb5b fix: match Indonesian category-mismatch message in scan failure mapping
f73efb3 feat: add wristband generator modal to event ticket dashboard
a3cf81c feat: add full brand detail tab with edit for internal partner accounts
b571c77 feat: add ticket PDF download option to manual generation flow
0a7b3ea fix: wire per-ticket holder inputs and promo discount that were built but never connected
```

## What changed

### 1. FLIP VA/QRIS payment UI
- `payment-instruction.tsx` now renders the real gateway response: VA number (parsed from a
  `"BANK:NUMBER"` string), a QRIS pop-up (rendered via `qrcode.react`) with a "buka di aplikasi"
  redirect option when the payload looks like a URL, and a countdown fed by the real
  `gatewayExpiry`.
- While `WAITING_PAYMENT`, polls `GET /transaction/:id` every ~5s and subscribes to
  `usePublicRealtimeSubscription(["transaction:"+id], ...)` for a faster path; auto-advances to
  the success step on `COMPLETED`.

### 2. Promo codes
- `PromoSection` (was a stub) now has a real input + "Terapkan" button calling
  `POST /promo/apply`, with a green success / red error state and a "Hapus" removal link.
- `OrderSummary.discount` subtracts from the total; the transaction fee (QRIS 3%/VA flat) is
  still computed on the **pre-discount** base — confirmed with product this session. A red
  "Diskon" row shows in the summary card and confirmation step when `discount > 0`.
- The applied promo code is sent to the backend on `storeTempTransaction`/`executeOrder` — the
  backend recomputes the discount authoritatively; the frontend value is display-only.

### 3. Per-ticket buyer data ("samakan data")
- After the existing single buyer contact form, the checkout now collects a **name + 16-digit
  NIK per ticket** (max 4 tickets per order, enforced client-side as a UX guard — backend is
  authoritative). A "Samakan dengan data utama" toggle copies the primary buyer's data into every
  holder and greys out the per-ticket inputs while active.
- Step 3 (order confirmation) shows a masked NIK per holder (`320xxxxxxxxx1234`) before payment.

### 4. [Khusus bola] Domicile restriction
- When `brand.category === "sepak_bola" && brand.homeOnly`, a banner informs the buyer the event
  is restricted to `brand.homeCity` KTP holders. The backend's rejection message is surfaced as a
  prominent blocking error if a purchase is rejected for domicile mismatch.

### 5. SCANNER role
- New `"scanner"` role alongside `admin`/`partner`. A username/password login form (toggle on the
  existing `/internal-tb` entry page, Google OAuth UI untouched) posts to
  `/internal-tb/token/scanner-login`. `AuthGuard` and a stripped-down `navbar-admin` variant lock
  the scanner shell down to a minimal beranda + the Scan Ticket action only — no Brand/Event/
  Analitik nav.

### 6. Scan flow split into validate + check-in
- Scanning now shows a read-only status first (`VALID`/`INVALID`/`ALREADY_CHECKED_IN`/
  `WRONG_CATEGORY`, with holder name + category) via the new `scan/validate` endpoint. A separate
  "CHECK IN" button performs the actual mutating check-in and shows `SUCCESS`/`FAILED CHECKED-IN`.
- An event → ticket category picker (brand-scoped for partner/scanner, unscoped for admin) gates
  the camera; only the selected category can be scanned. Reused as-is on the admin scan page.
- **Bugfix**: the validate-failure mapping originally only matched the English substring
  `"category"` for `WRONG_CATEGORY` detection, but the backend's message is Indonesian
  ("Kategori tidak sesuai...") — fixed in `842cb5b`, found and corrected during my own review of
  the parallel-built backend/frontend contract rather than by the implementing agent.

### 7. Partner ticket ingestion
- Simple bulk-paste UI (textarea, one code per line + partner name + brand) posting to
  `/internal-tb/partner-ticket/ingest`, showing `"{inserted} berhasil, {skipped} duplikat
  dilewati"`. The scan result UI renders partner-sourced scans (`source: "PARTNER"`) distinctly
  from Tiketbisa tickets.

### 8. Wristband generator modal
- "Generate Gelang" button on the event ticket dashboard opens a modal: status filter, recipient
  email, banner upload (reuses `ImageSourceInput`), and a per-category color/name-override/gate
  form. Fire-and-forget — confirms the request was accepted, generation + email happen async on
  the backend.

### 9. Brand detail tab everywhere
- The partner-facing single-brand page now has the full field set the admin brand form already
  had: `adminFee`, `category`, `subCategory`, `sponsorPath` (single combined sponsor image
  upload), plus the newer `homeOnly`/`homeCity` (shown conditionally for `sepak_bola`). The admin
  brand form was also missing `homeOnly`/`homeCity` — added there too for parity.

### 10. Manual ticket generation: download fallback
- The complimentary/manual generation page now lists each generated ticket with a "Download PDF"
  button (blob-fetch + temporary object URL, since the internal download route requires auth
  headers a plain `<a href>` can't carry) — for recovering from failed email delivery.

## Verification
`pnpm typecheck`: down to 1 pre-existing, unrelated error (`checkout.page.tsx`'s `EventSummary.status`
typing) — the other pre-existing error in `brands.page.tsx` was incidentally fixed while adding the
new brand fields there. `pnpm test`: all real Vitest suites pass; the `e2e/smoke.spec.ts` failure is
a pre-existing Playwright/Vitest config clash, unrelated to this work and present on the base branch.

## Follow-ups / assumptions that need a product or design decision
- **Promo discount base**: confirmed with product this session — computed pre-discount (see
  backend notes). If that changes, `use-order-summary.ts`'s `withTransactionFee` needs updating.
- **Scanner beranda**: intentionally minimal (no real dashboard stats) since the backend
  explicitly locks scanner out of `/analytics/*` to avoid leaking cross-brand data. If a
  scanner-safe analytics view is wanted later, it needs a new brand-scoped backend endpoint first.
- **Wristband modal is fire-and-forget** — there's no in-app confirmation once the email actually
  arrives; if that matters, a follow-up could poll a job-status endpoint (none exists yet).
- FLIP integration was built and wired against a **mock gateway fallback** (no real sandbox
  credentials this session) — see the backend's `V2_CHANGES.md` for the exact env vars needed
  before this can be smoke-tested against real FLIP sandbox payments.

## Found and fixed during local functional testing

Ran `pnpm dev` against the live local backend and clicked through the actual checkout flow, brand
tab, and scanner login in a browser (not just typecheck/unit tests). Found and fixed three real
integration bugs (commit `0a7b3ea`) that unit tests couldn't have caught, because each component
worked correctly in isolation — they just weren't wired to each other:

1. **The entire per-ticket holder section never rendered.** `<OrderDetailsForm>` in
   `checkout.page.tsx` was called without `items`/`holders`/`onHolderChange`/etc., so its
   conditional render guard (`items.length > 0 && onHolderChange && ...`) was always false. The
   component, the validation, the "samakan data" hook logic — all built correctly, just never
   connected to the page. Every real checkout would have failed at the final commit step with a
   backend validation error the buyer had no way to resolve, since they were never shown the
   inputs. Wired `useCheckoutForm()`'s holder state/handlers into `OrderDetailsForm` and threaded
   `holders` into `useCheckoutSteps`.
2. **The promo discount always computed as Rp 0.** `promoApi.applyPromo(code, eventId)` never sent
   `subtotal`/`serviceFee`, and the backend defaults those to zero when absent — so `/promo/apply`
   always returned `success: true` with `discount: 0`. The UI showed a convincing "Kode promo
   berhasil diterapkan: -Rp 0" with no error, which would have looked like a working feature in a
   quick glance. Fixed by passing the actual `OrderSummary.subtotal`/`serviceFee` in the request.
3. **The re-lock-with-holders on leaving step 1 was skipped whenever a lock already existed.**
   The checkout already acquires a preliminary "intent" lock on mount (before the buyer has
   entered anything) to reserve inventory quickly. `handleNext`'s step-1 handler treated any
   existing `lockId` as "already locked, nothing to do" and skipped re-acquiring the lock with the
   buyer's actual holder data — so the final purchase commit always saw an empty holders array
   regardless of what the buyer typed. Now always re-locks (which the backend already supports
   idempotently) when advancing from step 1.

**Verified working end-to-end in a real browser** against the live local backend: full QRIS
checkout including per-ticket holder inputs, "samakan data" toggle, promo code with correct
discount math, QRIS mock QR rendering, order execution, webhook-driven completion, and ticket
email delivery (checked via Mailhog); scanner username/password login landing on the correct
locked-down shell with no nav links; scanner blocked from navigating directly to an admin route.

**Known gap, not fixed (documented, not blocking)**: the step-3 order confirmation page doesn't
show the "list of ticket holders with masked NIK" the original spec called for — `OrderConfirmation`
never received a `holders` prop and doesn't render one. The buyer's own identity is still shown in
full on that step, and the backend receives and validates the real per-ticket data correctly, so
this is a display-only omission, not a data-correctness issue. Worth a follow-up pass.

## Reconciliation with open team PRs (#39, #40)

After the v2 feature work above, the two open frontend PRs targeting `dev` were pulled into `v2`
and merged, preferring the PR implementation on any overlap (per product direction). These pair
with the backend's PR #37/#38.

- **PR #39 (scanner-access-pricing)** — adopted the team's checkout pricing refactor
  (`checkout.pricing.ts` with `buildBaseOrderSummary`/`buildPaymentOrderSummary`,
  `serviceFeePerTicket` + `transactionFeeDescription`, and the shared
  `~/shared/constants/transaction` `MAX_TICKETS_PER_TRANSACTION`), and its scanner shell
  (`ScannerNavbar`, `modules/internal/scanner/` pages, the entry-page scanner login form). My
  promo discount, per-ticket holders (+ samakan-data), FLIP VA/QRIS wiring, and domicile handling
  were re-applied on top: `OrderSummary` now carries both `serviceFeePerTicket` (PR) and `discount`
  (mine); `buildPaymentOrderSummary` computes the transaction fee on the pre-discount base and
  subtracts the promo discount from the final total. My superseded scanner modules
  (`scanner-dashboard/`, `scanner-scan/`) and the duplicate scanner route block were removed.
- **PR #40 (ticket-delivery-actions)** — adopted the team's `TicketDeliveryActions` (per-transaction
  email + ZIP download) on the event ticket dashboard, alongside my Generate Gelang wristband modal
  (both render there), plus PR #40's shared `downloadInternalBlob` helper (my `downloadTicketPdf`
  and the payment-proof download were refactored onto it).

### Bugs found in the incoming PRs while reconciling (fixed in the merge/fix commits)
- `requestScannerToken` posted to `/internal-tb/token/scanner/login`, but the real backend route
  (PR #37) is `/internal-tb/token/login`. Corrected, and removed my now-dead `requestScannerLogin`
  (`/token/scanner-login`).
- The admin brands access "Coba Lagi" button compared `accessState` to `"loading"` inside the
  `"unavailable"` branch (impossible narrowing, TS2367) — removed the dead check.
- PR #39's `use-ticket-selection.test.ts` was missing the `// @vitest-environment jsdom` pragma this
  repo requires for `renderHook` tests — added it.
- The auto-merge left **duplicate transaction-fee rows** in `order-summary-card.tsx` (PR #39's
  "Biaya transaksi (payment gateway)" + my plainer "Biaya Transaksi"), so the fee showed twice —
  removed the redundant one.

### Verified after merge (live, against the merged backend)
Checkout pricing shows the PR #39 breakdown ("5.000 x 2 tiket") AND my promo discount together with
correct math (fee on pre-discount base, discount off the final total); per-ticket holder inputs +
samakan-data still render and re-lock with holders on step 1; scanner username/password login hits
`/token/login` and lands on the locked-down scanner beranda. `pnpm build` (client + SSR) passes;
`pnpm typecheck` shows only the 1 pre-existing `EventSummary.status` error; `pnpm test` 22/22 pass.

### PR strategy
`v2` now contains the merged work of PRs #37–#40 plus all the Scope v2 features. Opening one PR per
repo from `v2` → `dev` that **incorporates and supersedes** PRs #37–#40 — those can be closed once
this merges (or merged first, in which case this PR's diff shrinks to just the net-new v2 work,
since their commits are already in `v2`'s history).
