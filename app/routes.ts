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
    route("event", "modules/external/event/presentation/event.page.tsx"),
    route("event/:eventId", "modules/external/event/presentation/event-detail.page.tsx"),
    route("brand", "modules/external/brand/presentation/brand.page.tsx", {
      id: "brand",
    }),
    route(
      "brand/:slug",
      "modules/external/brand/presentation/brand-detail.page.tsx",
      { id: "brand-detail" },
    ),
    route("tentang", "modules/external/static/tentang.page.tsx"),
    route("hubungi", "modules/external/static/hubungi.page.tsx"),
  ]),

  layout("layouts/checkout.layout.tsx", [
    route(
      "checkout/:eventId",
      "modules/external/checkout/presentation/checkout.page.tsx",
    ),
  ]),

  // ─── Admin Login (Standalone) ───
  route("internal-tb/admin/login", "modules/admin/login/presentation/login.page.tsx"),
  route("internal-tb/partner/login", "modules/internal/login/presentation/login.page.tsx"),

  // ─── Admin Layout (internal team — sees all brands) ───
  layout("layouts/admin.layout.tsx", [
    route(
      "internal-tb/admin",
      "modules/admin/dashboard/presentation/dashboard.page.tsx",
      { index: true },
    ),
    route(
      "internal-tb/admin/brands",
      "modules/admin/brands/presentation/brands.page.tsx",
    ),
    route(
      "internal-tb/admin/events",
      "modules/admin/events/presentation/events.page.tsx",
    ),
    route(
      "internal/admin/events/:eventId/tickets/new",
      "modules/internal/events/presentation/create-ticket.page.tsx",
    ),
    route(
      "internal-tb/admin/analytics",
      "modules/admin/analytics/presentation/analytics.page.tsx",
    ),
    route(
      "internal-tb/admin/scan",
      "modules/admin/scan/presentation/scan.page.tsx",
    ),
    route(
      "internal-tb/admin/transactions/:id",
      "modules/admin/transactions/presentation/transaction-details.page.tsx",
    ),
  ]),

  // ─── Partner Layout (each partner — sees only own brand) ───
  layout("layouts/internal.layout.tsx", [
    route(
      "internal-tb/partner",
      "modules/internal/dashboard/presentation/dashboard.page.tsx",
      { index: true },
    ),
    route(
      "internal-tb/partner/brands",
      "modules/internal/brand/presentation/brand.page.tsx",
    ),
    route(
      "internal-tb/partner/events",
      "modules/internal/events/presentation/events.page.tsx",
    ),
    route(
      "internal/partner/events/:eventId/tickets/new",
      "modules/internal/events/presentation/create-ticket.page.tsx",
    ),
    route(
      "internal-tb/partner/analytics",
      "modules/internal/revenue-analytics/presentation/revenue-analytics.page.tsx",
    ),
    route(
      "internal-tb/partner/transactions/:id",
      "modules/internal/transaction-details/presentation/transaction-details.page.tsx",
    ),
    route(
      "internal-tb/partner/scan",
      "modules/internal/ticket-scanning/presentation/ticket-scanning.page.tsx",
    ),
  ]),
] satisfies RouteConfig;