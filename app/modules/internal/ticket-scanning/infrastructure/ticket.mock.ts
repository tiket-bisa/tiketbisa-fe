import type { TicketDashboardSummary } from "~/core/types";

export const mockTicketDashboard: TicketDashboardSummary[] = [
  {
    event_id: "evt-1",
    event_name: "Adhyaksa FC vs Persija Jakarta",
    total_tickets: 5000,
    available_tickets: 3450,
    checked_in_tickets: 1200,
    sold_tickets: 1550,
  },
  {
    event_id: "evt-2",
    event_name: "Adhyaksa FC vs Persib Bandung",
    total_tickets: 5000,
    available_tickets: 4200,
    checked_in_tickets: 0,
    sold_tickets: 800,
  },
  {
    event_id: "evt-3",
    event_name: "Adhyaksa FC vs Arema FC",
    total_tickets: 5000,
    available_tickets: 4800,
    checked_in_tickets: 0,
    sold_tickets: 200,
  },
];
