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
    route("brand", "modules/external/brand-selection/presentation/brand-selection.page.tsx", {
      id: "brand-selection",
    }),
    route(
      "brand/:slug",
      "modules/external/brand-selection/presentation/brand-selection.page.tsx",
      { id: "brand-selection-slug" },
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
  route("admin/login", "modules/admin/login/presentation/login.page.tsx"),

  // ─── Admin Layout (internal team — sees all brands) ───
  layout("layouts/admin.layout.tsx", [
    route(
      "admin",
      "modules/admin/dashboard/presentation/dashboard.page.tsx",
      { index: true },
    ),
    route(
      "admin/brands",
      "modules/admin/brands/presentation/brands.page.tsx",
    ),
    route(
      "admin/events",
      "modules/admin/events/presentation/events.page.tsx",
    ),
    route(
      "admin/analytics",
      "modules/admin/analytics/presentation/analytics.page.tsx",
    ),
    route(
      "admin/transactions/:id",
      "modules/admin/transactions/presentation/transaction-details.page.tsx",
    ),
  ]),

  // ─── Partner Login (Standalone) ───
  route("partner/login", "modules/internal/login/presentation/login.page.tsx"),

  // ─── Partner Layout (each partner — sees only own brand) ───
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
