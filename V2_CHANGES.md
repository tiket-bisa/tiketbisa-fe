# V2 Scope — Frontend Changes

Committed to `v2` as 9 feature commits (+1 bugfix) on top of `37f51a6` (brand admin_fee/category/
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
