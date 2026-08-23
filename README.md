# Tiketbisa Frontend

Event ticketing platform — React Router 7, TypeScript, Tailwind CSS v4, Vite.

## Changelog

### 23 August 2026 — Payment Sessions production rollout

This release added the hosted checkout flow for activated payment methods,
production quality gates and rollback, sanitized user-facing messages, and
reliable release of abandoned checkout locks.

#### [#59 — feat: support hosted Xendit checkout](https://github.com/tiket-bisa/tiketbisa-fe/pull/59)

Merged `09d5058` · 22 files · +326 / -253

<details>
<summary>Files changed</summary>

- `app/core/api/services/transaction.api.test.ts`
- `app/core/api/services/transaction.api.ts`
- `app/core/constants/transaction.test.ts`
- `app/core/constants/transaction.ts`
- `app/core/types/index.ts`
- `app/modules/admin/dashboard/presentation/components/transaction-table.test.tsx`
- `app/modules/admin/dashboard/presentation/dashboard.page.tsx`
- `app/modules/external/checkout/domain/checkout.pricing.test.ts`
- `app/modules/external/checkout/domain/checkout.pricing.ts`
- `app/modules/external/checkout/domain/checkout.types.ts`
- `app/modules/external/checkout/domain/checkout.validation.test.ts`
- `app/modules/external/checkout/domain/checkout.validation.ts`
- `app/modules/external/checkout/infrastructure/order.api.ts`
- `app/modules/external/checkout/infrastructure/payment.api.test.ts`
- `app/modules/external/checkout/infrastructure/payment.api.ts`
- `app/modules/external/checkout/presentation/checkout.page.tsx`
- `app/modules/external/checkout/presentation/components/steps/payment-instruction.tsx`
- `app/modules/external/checkout/presentation/components/steps/payment-method-selection.tsx`
- `app/modules/external/checkout/presentation/hooks/use-checkout-steps.ts`
- `app/modules/internal/dashboard/presentation/dashboard.page.tsx`
- `e2e/helpers/e2e-api.ts`
- `e2e/smoke.spec.ts`

</details>

#### [#60 — ci: add frontend quality gates and safe production rollback](https://github.com/tiket-bisa/tiketbisa-fe/pull/60)

Merged `f57a32f` · 12 files · +287 / -119

<details>
<summary>Files changed</summary>

- `.env.example`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/e2e.yml`
- `Dockerfile`
- `app/core/api/api-url.ts`
- `app/modules/external/checkout/presentation/components/steps/payment-instruction.tsx`
- `app/routes.ts`
- `app/routes/healthz.ts`
- `docker-compose.yml`
- `docs/production-cicd.md`
- `scripts/deploy-production.sh`

</details>

#### [#61 — fix: detect compose-managed frontend container](https://github.com/tiket-bisa/tiketbisa-fe/pull/61)

Merged `dd431d0` · 1 file · +39 / -5

<details>
<summary>Files changed</summary>

- `scripts/deploy-production.sh`

</details>

#### [#62 — fix: sanitize user-facing messages](https://github.com/tiket-bisa/tiketbisa-fe/pull/62)

Merged `f353cbb` · 39 files · +397 / -144

<details>
<summary>Files changed</summary>

- `app/core/api/api-error.test.ts`
- `app/core/api/api-error.ts`
- `app/core/api/api-fetch.ts`
- `app/core/api/api-response.type.ts`
- `app/core/api/http-client.ts`
- `app/core/api/index.ts`
- `app/core/api/use-api.ts`
- `app/core/auth/google-oauth.client.ts`
- `app/modules/admin/brands/presentation/brands.page.tsx`
- `app/modules/admin/events/presentation/events.page.tsx`
- `app/modules/admin/integration-clients/presentation/integration-clients.page.tsx`
- `app/modules/admin/promos/infrastructure/promo.api.ts`
- `app/modules/admin/promos/presentation/promos.page.tsx`
- `app/modules/admin/transactions/presentation/transaction-details.page.tsx`
- `app/modules/external/checkout/infrastructure/ticket-delivery.api.test.ts`
- `app/modules/external/checkout/infrastructure/ticket-delivery.api.ts`
- `app/modules/external/checkout/presentation/components/shared/order-summary-card.tsx`
- `app/modules/external/checkout/presentation/components/steps/manual-transfer-pending.tsx`
- `app/modules/external/checkout/presentation/components/steps/payment-instruction.test.tsx`
- `app/modules/external/checkout/presentation/components/steps/payment-instruction.tsx`
- `app/modules/external/checkout/presentation/components/steps/payment-method-selection.test.tsx`
- `app/modules/external/checkout/presentation/components/steps/payment-method-selection.tsx`
- `app/modules/external/checkout/presentation/hooks/use-ticket-archive-actions.ts`
- `app/modules/external/static/contact.api.ts`
- `app/modules/external/static/hubungi.page.tsx`
- `app/modules/internal/brand/presentation/brand.page.tsx`
- `app/modules/internal/common/infrastructure/partner.api.ts`
- `app/modules/internal/common/presentation/event-gallery-manager.tsx`
- `app/modules/internal/common/presentation/image-source-input.tsx`
- `app/modules/internal/common/presentation/payment-proof-actions.tsx`
- `app/modules/internal/common/presentation/use-partner-dashboard-data.ts`
- `app/modules/internal/events/presentation/events.page.tsx`
- `app/modules/internal/events/presentation/generate-complimentary-ticket.page.tsx`
- `app/modules/internal/ticket-delivery/presentation/ticket-delivery-actions.tsx`
- `app/modules/internal/ticket-scanning/presentation/hooks/use-checkin.ts`
- `app/modules/internal/ticket-scanning/presentation/hooks/use-scan-flow.ts`
- `app/modules/internal/transaction-details/presentation/transaction-details.page.tsx`
- `app/root.tsx`
- `e2e/smoke.spec.ts`

</details>

#### [#63 — fix: release abandoned checkout locks](https://github.com/tiket-bisa/tiketbisa-fe/pull/63)

Merged `a8ece88` · 6 files · +77 / -4

<details>
<summary>Files changed</summary>

- `app/modules/external/checkout/infrastructure/order.api.test.ts`
- `app/modules/external/checkout/infrastructure/order.api.ts`
- `app/modules/external/checkout/presentation/components/layout/checkout-sidebar.tsx`
- `app/modules/external/checkout/presentation/components/layout/checkout-sticky-bar.tsx`
- `app/modules/external/checkout/presentation/hooks/use-checkout-steps.ts`
- `e2e/smoke.spec.ts`

</details>

## Tech Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| Framework       | React Router 7 (SSR)               |
| Language        | TypeScript 5 (strict)              |
| Styling         | Tailwind CSS v4 (CSS-first config) |
| Bundler         | Vite 7                             |
| Package Manager | **pnpm** (mandatory)               |

## Getting Started

```bash
pnpm install
pnpm dev          # → http://localhost:5173
pnpm build        # Production build
pnpm start        # Serve production build
pnpm typecheck    # Type-check without emitting
```

### Environment Variables

```bash
cp .env.example .env
```

### Local Development — Internal Dashboard

The internal dashboard uses a single `/internal-tb` entry point in production.
For local dev, open:

```
http://localhost:5173/internal-tb
```

The checkout flow stays on the public `/checkout/*` path.

## E2E Smoke Tests (Local)

Prerequisites:
- Backend compose is running with E2E mode explicitly enabled and the local E2E seeder allowed:

  ```bash
  cd ../tiketbisa-be
  TB_E2E_MODE=true SUPER_ADMIN_EMAIL=e2e-admin@tiketbisa.local docker compose up -d --build
  ```
- Frontend dev server is running.

```bash
cd tiketbisa-fe
pnpm install
pnpm exec playwright install
pnpm e2e
```

### Optional Environment Variables (E2E)

```bash
E2E_BASE_URL=http://localhost:5173
E2E_API_BASE_URL=http://localhost:8080
E2E_ADMIN_EMAIL=admin.e2e@tiketbisa.local
E2E_PARTNER_EMAIL=partner.e2e@tiketbisa.local
E2E_INTERNAL_TOKEN=e2e-token
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

## Architecture

### Domain Separation

The project is divided into two domains:

| Domain       | URL (Production)      | Path Prefix  | Description                                 |
| ------------ | --------------------- | ------------ | ------------------------------------------- |
| **External** | `tiketbisa.com`       | `/`          | Public platform — landing, search, checkout |
| **Internal** | `tiketbisa.com` | `/internal-tb/*` | Internal dashboard — role-based access, analytics, scanning |

### Directory Structure

```
app/
├── core/                              # Shared kernel (cross-domain)
│   ├── api/
│   │   ├── api-response.type.ts       # ApiResponse<T> contract
│   │   ├── pagination.type.ts         # PaginationParams (limit/offset)
│   │   └── index.ts                   # Barrel exports
│   ├── auth/                          # Auth provider & guard
│   ├── design-system/
│   │   ├── theme.ts                   # TS color token constants
│   │   └── components/                # Shared UI atoms
│   ├── types/
│   │   └── index.ts                   # Shared domain entities
│   └── utils/
│       └── index.ts
│
├── modules/
│   ├── external/                      # PUBLIC PLATFORM
│   │   ├── landing/
│   │   │   ├── domain/                # .type.ts, .entity.ts
│   │   │   ├── infrastructure/        # API calls, mappers
│   │   │   └── presentation/          # .page.tsx, hooks, components
│   │   ├── event-search/              # (same 3-layer pattern)
│   │   ├── brand/
│   │   ├── checkout/                  # Trust Mode enforced
│   │   └── static/                    # Simple pages (tentang, hubungi)
│   │
│   └── internal/                      # INTERNAL DASHBOARD
│       ├── entry/                      # Single Google sign-in entry point
│       ├── dashboard/
│       ├── brand/
│       ├── events/
│       ├── revenue-analytics/
│       ├── transaction-details/
│       └── ticket-scanning/
│
├── shared/                            # Cross-module reusables
│   ├── components/                    # Shared UI beyond design system
│   ├── hooks/                         # Shared custom hooks
│   └── utils/                         # Shared utilities
│
├── layouts/
│   ├── external.layout.tsx            # Header + nav + Footer + <Outlet/>
│   ├── internal.layout.tsx            # Internal header + nav + <Outlet/>
│   └── checkout.layout.tsx            # Trust Mode — minimal, Brand Purple only
│
├── app.css                            # Tailwind + design tokens
├── root.tsx                           # HTML shell
└── routes.ts                          # Route config
```

### 3-Layer Pattern (per module)

Every module under `modules/` follows three layers:

| Layer             | Contains                               | Extension                |
| ----------------- | -------------------------------------- | ------------------------ |
| `domain/`         | Entities, interfaces, type definitions | `.type.ts`, `.entity.ts` |
| `infrastructure/` | API calls (fetch/axios), data mappers  | `.ts`                    |
| `presentation/`   | Page components, hooks, sub-components | `.page.tsx`, `.tsx`      |

### API Contract

All API responses **must** match this TypeScript interface:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: ApiError | null;
  status_code: number;
}
```

All list endpoints **must** use pagination:

```typescript
interface PaginationParams {
  limit: number;
  offset: number;
}
```

### Design Tokens (from Engineer Guide)

| Section       | Token                     | Hex       | Usage                |
| ------------- | ------------------------- | --------- | -------------------- |
| **Base**      | `base.white`              | `#FFFFFF` | Main app background  |
|               | `base.inverse`            | `#0F0B1F` | Dark mode background |
| **Surface**   | `primary.surface`         | `#0F0B1F` | Big components       |
|               | `primary.surface-alt`     | `#17122B` | Cards, panels        |
|               | `primary.surface-hover`   | `#211A3A` | Hover surfaces       |
| **Brand 4.1** | `brand.primary.default`   | `#6D5CFF` | Main CTA             |
|               | `brand.primary.hover`     | `#5A4AE6` | Hover state          |
|               | `brand.primary.active`    | `#4C3FD1` | Pressed              |
|               | `brand.primary.subtle`    | `#2A2355` | Soft background      |
| **Brand 4.2** | `brand.secondary.default` | `#22C7A9` | Secondary actions    |
|               | `brand.secondary.hover`   | `#1DAE94` | Hover                |
|               | `brand.secondary.subtle`  | `#163F3A` | Badge background     |
| **Club 5**    | `club.accent`             | runtime   | Club dynamic color   |
|               | `club.accentSubtle`       | runtime   | Club subtle bg       |
|               | `club.accentText`         | runtime   | Text on club accent  |
| **Text 8**    | `text.primary`            | `#F5F3FF` | Main text            |
|               | `text.secondary`          | `#C7C2FF` | Supporting text      |
|               | `text.tertiary`           | `#8B85B3` | Caption              |
|               | `text.inverse`            | `#0F0B1F` | On light background  |
| **Border 9**  | `border.default`          | `#2B2550` | Default border       |
|               | `border.subtle`           | `#221C40` | Subtle border        |
|               | `divider`                 | `#1C1735` | Divider lines        |

**Trust Mode (Checkout):** The `[data-trust-mode="true"]` CSS selector locks `--color-accent` to Brand Purple and removes all dynamic club accents.

## Git Strategy

### Branch Naming

| Prefix        | Usage                      |
| ------------- | -------------------------- |
| `feature/*`   | New features               |
| `refactor/*`  | Code improvements          |
| `hotfix/*`    | Production bug fixes       |
| `ci/*`        | CI/CD pipeline changes     |
| `migration/*` | Database / data migrations |

### Rules

- **pnpm only** — do not use npm or yarn
- **TypeScript strict mode** — no `any` unless explicitly justified
- **Path alias** — use `~/` to import from `app/` (e.g. `import { theme } from "~/core/design-system/theme"`)

---

Built with ❤️ using React Router.
