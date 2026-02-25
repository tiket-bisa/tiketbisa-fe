import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // ─── External Layout (tiketbisa.com) ───
  layout("layouts/external.layout.tsx", [
    index("modules/external/landing/presentation/landing.page.tsx"),
    route(
      "explore",
      "modules/external/event-search/presentation/event-search.page.tsx",
    ),
    route(
      "brand/:slug",
      "modules/external/brand-selection/presentation/brand-selection.page.tsx",
    ),
    route("tentang", "modules/external/static/tentang.page.tsx"),
    route("hubungi", "modules/external/static/hubungi.page.tsx"),
  ]),

  // ─── Checkout Layout (Trust Mode — strips dynamic club accents) ───
  layout("layouts/checkout.layout.tsx", [
    route(
      "checkout/:eventId",
      "modules/external/checkout/presentation/checkout.page.tsx",
    ),
  ]),

  // ─── Partner Login (Standalone — no layout wrapper) ───
  route("partner/login", "modules/internal/login/presentation/login.page.tsx"),

  // ─── Internal Layout ([subdomain].tiketbisa.com) ───
  layout("layouts/internal.layout.tsx", [
    route(
      "partner",
      "modules/internal/dashboard/presentation/dashboard.page.tsx",
      { index: true },
    ),
    route(
      "partner/brands",
      "modules/internal/brand-selection/presentation/brand-selection.page.tsx",
    ),
    route(
      "partner/events",
      "modules/internal/events/presentation/events.page.tsx",
    ),
    route(
      "partner/analytics",
      "modules/internal/revenue-analytics/presentation/revenue-analytics.page.tsx",
    ),
    route(
      "partner/transactions/:id",
      "modules/internal/transaction-details/presentation/transaction-details.page.tsx",
    ),
    route(
      "partner/scan",
      "modules/internal/ticket-scanning/presentation/ticket-scanning.page.tsx",
    ),
  ]),
] satisfies RouteConfig;
