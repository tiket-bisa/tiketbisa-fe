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
    route("tentang", "modules/external/static/tentang.page.tsx"),
    route("hubungi", "modules/external/static/hubungi.page.tsx"),
    route("faq", "modules/external/static/faq.page.tsx"),
    route("syarat-ketentuan", "modules/external/static/syarat-ketentuan.page.tsx"),
    route("kebijakan-privasi", "modules/external/static/kebijakan-privasi.page.tsx"),
    route("ketentuan-layanan", "modules/external/static/ketentuan-layanan.page.tsx"),
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
  ]),

  layout("layouts/checkout.layout.tsx", [
    route(
      "checkout/:eventId",
      "modules/external/checkout/presentation/checkout.page.tsx",
    ),
  ]),

  route("internal-tb", "modules/internal/entry/presentation/entry.page.tsx"),

  // ─── Internal Login Aliases (redirect to single entry point) ───
  route("internal-tb/admin/login", "modules/internal/entry/presentation/login-redirect.page.tsx", {
    id: "internal-login-admin-redirect",
  }),
  route("internal-tb/partner/login", "modules/internal/entry/presentation/login-redirect.page.tsx", {
    id: "internal-login-partner-redirect",
  }),
  route("internal-tb/scanner/login", "modules/internal/entry/presentation/login-redirect.page.tsx", {
    id: "internal-login-scanner-redirect",
  }),

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
      "internal-tb/admin/events/:eventId/tickets/new",
      "modules/internal/events/presentation/create-ticket.page.tsx",
      { id: "admin-create-ticket" } // <-- Added unique ID here
    ),
    route(
      "internal-tb/admin/events/:eventId/tickets",
      "modules/internal/events/presentation/event-ticket-dashboard.page.tsx",
      { id: "admin-event-ticket-dashboard" },
    ),
    route(
      "internal-tb/admin/events/:eventId/complimentary/new",
      "modules/internal/events/presentation/generate-complimentary-ticket.page.tsx",
      { id: "admin-generate-complimentary-ticket" },
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
      "internal-tb/admin/partner-tickets",
      "modules/internal/partner-ticket-ingest/presentation/partner-ticket-ingest.page.tsx",
      { id: "admin-partner-ticket-ingest" },
    ),
    route(
      "internal-tb/admin/integration-clients",
      "modules/admin/integration-clients/presentation/integration-clients.page.tsx",
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
      "internal-tb/partner/events/:eventId/tickets/new",
      "modules/internal/events/presentation/create-ticket.page.tsx",
      { id: "partner-create-ticket" }
    ),
    route(
      "internal-tb/partner/events/:eventId/tickets",
      "modules/internal/events/presentation/event-ticket-dashboard.page.tsx",
      { id: "partner-event-ticket-dashboard" },
    ),
    route(
      "internal-tb/partner/events/:eventId/complimentary/new",
      "modules/internal/events/presentation/generate-complimentary-ticket.page.tsx",
      { id: "partner-generate-complimentary-ticket" },
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
    route(
      "internal-tb/partner/partner-tickets",
      "modules/internal/partner-ticket-ingest/presentation/partner-ticket-ingest.page.tsx",
      { id: "partner-partner-ticket-ingest" },
    ),
  ]),

  layout("layouts/scanner.layout.tsx", [
    route(
      "internal-tb/scanner",
      "modules/internal/scanner/presentation/scanner-dashboard.page.tsx",
      { index: true },
    ),
    route(
      "internal-tb/scanner/scan",
      "modules/internal/scanner/presentation/scanner-scan.page.tsx",
    ),
  ]),
] satisfies RouteConfig;
