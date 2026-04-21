# Pull Request Descriptions

---

## `feature/admin-dashboard`

**Title:** feat: add internal admin dashboard with role-based access control

**Description:**

Adds a full admin dashboard accessible at `/internal/admin/*` for the TiketBisa internal team.

### What's included

- **Role-based authentication** — Auth system supports `admin` and `partner` roles with dedicated login flows and route guards
- **Admin dashboard** — Overview page with aggregate stats across all brands, filterable transaction table with Kategori + Qty columns
- **Brands management** — View all partner brands with search, sort, and status indicators
- **Events management** — Browse all events across brands with brand filter and status tabs
- **Revenue analytics** — Revenue breakdown tables with per-category ticket sales visualization
- **Transaction details** — Detailed transaction view for individual orders
- **Admin layout & navbar** — Dedicated layout with admin navigation bar

### Routes

All admin routes are under `/internal/admin/`:

- `/internal/admin` — Dashboard
- `/internal/admin/login` — Admin login
- `/internal/admin/brands` — Brands overview
- `/internal/admin/events` — Events overview
- `/internal/admin/analytics` — Revenue analytics
- `/internal/admin/transactions/:id` — Transaction details

---

## `feature/partner-dashboard`

**Title:** feat: add internal partner dashboard with brand-scoped access

**Description:**

Adds a partner dashboard accessible at `/internal/partner/*` where each partner can only view data scoped to their own brand.

### What's included

- **Role-based authentication** — Auth system with `admin` and `partner` roles; partner login includes brand selection
- **Brand-scoped filtering** — All dashboard data (events, transactions, analytics, ticket scanning) is filtered by the partner's `brand_slug`
- **Partner dashboard** — Overview with stats and transaction table scoped to the partner's brand, with Kategori + Qty columns
- **Events management** — View and manage events belonging to the partner's brand only
- **Revenue analytics** — Revenue data and per-category ticket sales breakdown for the partner's brand
- **Ticket scanning** — QR code ticket scanning interface filtered by brand
- **Transaction details** — Transaction view restricted to the partner's own transactions
- **Partner layout & navbar** — Dedicated layout with partner navigation showing brand name

### Routes

All partner routes are under `/internal/partner/`:

- `/internal/partner` — Dashboard
- `/internal/partner/login` — Partner login with brand selection
- `/internal/partner/events` — Events overview
- `/internal/partner/analytics` — Revenue analytics
- `/internal/partner/ticket-scanning` — Ticket scanning
- `/internal/partner/transactions/:id` — Transaction details
