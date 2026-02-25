# Tiketbisa Frontend

Event ticketing platform — React Router 7, TypeScript, Tailwind CSS v4, Vite.

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

The internal (partner) dashboard uses subdomain routing in production.
For local dev, append `?mode=internal` to any URL:

```
http://localhost:5173/partner?mode=internal
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
| **Internal** | `[tbd].tiketbisa.com` | `/partner/*` | Partner dashboard — analytics, scanning     |

### Directory Structure

```
app/
├── core/                              # Shared kernel (cross-domain)
│   ├── api/
│   │   ├── api-response.type.ts       # ApiResponse<T> contract
│   │   ├── pagination.type.ts         # PaginationParams (limit/offset)
│   │   └── index.ts                   # Barrel exports
│   ├── auth/                          # Auth provider & guard (TODO)
│   ├── design-system/
│   │   ├── theme.ts                   # TS color token constants
│   │   └── components/                # Shared UI atoms (TODO)
│   ├── types/
│   │   └── index.ts                   # Shared domain entities (TODO)
│   └── utils/
│       ├── subdomain.ts               # App mode detection
│       └── index.ts
│
├── modules/
│   ├── external/                      # PUBLIC PLATFORM
│   │   ├── landing/
│   │   │   ├── domain/                # .type.ts, .entity.ts
│   │   │   ├── infrastructure/        # API calls, mappers
│   │   │   └── presentation/          # .page.tsx, hooks, components
│   │   ├── event-search/              # (same 3-layer pattern)
│   │   ├── brand-selection/
│   │   ├── checkout/                  # Trust Mode enforced
│   │   └── static/                    # Simple pages (tentang, hubungi)
│   │
│   └── internal/                      # PARTNER DASHBOARD
│       ├── login/                     # Standalone (no layout)
│       ├── dashboard/
│       ├── brand-selection/
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
│   ├── internal.layout.tsx            # Partner header + nav + <Outlet/>
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
