import type { TicketDashboardSummary } from "~/core/types";

export const mockTicketDashboard: TicketDashboardSummary[] = [
  {
    event_id: "evt-1",
    event_name: "Adhyaksa FC vs Persija Jakarta",
    brand_slug: "adhyaksa-fc",
    total_tickets: 5000,
    available_tickets: 3450,
    checked_in_tickets: 1200,
    sold_tickets: 1550,
  },
  {
    event_id: "evt-2",
    event_name: "Adhyaksa FC vs Persib Bandung",
    brand_slug: "adhyaksa-fc",
    total_tickets: 5000,
    available_tickets: 4200,
    checked_in_tickets: 0,
    sold_tickets: 800,
  },
  {
    event_id: "evt-3",
    event_name: "Adhyaksa FC vs Arema FC",
    brand_slug: "adhyaksa-fc",
    total_tickets: 5000,
    available_tickets: 4800,
    checked_in_tickets: 0,
    sold_tickets: 200,
  },
  {
    event_id: "evt-6",
    event_name: "Persija vs Bali United",
    brand_slug: "persija-jakarta",
    total_tickets: 8000,
    available_tickets: 5500,
    checked_in_tickets: 800,
    sold_tickets: 2500,
  },
  {
    event_id: "evt-8",
    event_name: "Persib vs Madura United",
    brand_slug: "persib-bandung",
    total_tickets: 6000,
    available_tickets: 4200,
    checked_in_tickets: 600,
    sold_tickets: 1800,
  },
];
