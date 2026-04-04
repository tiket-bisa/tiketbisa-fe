import { httpClient } from "../http-client";

/* ── BE data shapes ── */

export interface TicketCategoryApiData {
    id: string;
    event_id: string;
    name: string;
    description: string | null;
    total_ticket: number;
    issued_ticket: number;
    checked_in_ticket: number;
    price: number;
    created: string | null;
}

export interface TicketCategoryListResponse {
    ticket_categories?: TicketCategoryApiData[];
    total_count: number;
    limit: number;
    offset: number;
}

/* ── API functions ── */

export const ticketCategoryApi = {
    getByEvent: (eventId: string) =>
        httpClient.get<TicketCategoryApiData[]>(`/ticket-category/event/${eventId}`),

    getById: (id: string) =>
        httpClient.get<TicketCategoryApiData>(`/ticket-category/${id}`),

    getList: (params?: { limit?: number; offset?: number }) => {
        const qs = new URLSearchParams();
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const str = qs.toString();
        return httpClient.get<TicketCategoryListResponse>(
            `/ticket-category${str ? `?${str}` : ""}`,
        );
    },

    create: (data: { eventId: string; name: string; description?: string; categoryCode: string; totalTicket: number; price: number }) =>
        httpClient.post<TicketCategoryApiData>("/internal-tb/ticket-category", data),
};

/* ── Mapper: BE → FE type ── */

import type { Ticket, TicketDashboardSummary } from "~/core/types";

export function mapTicketCategoryToFe(api: TicketCategoryApiData): Ticket {
    return {
        id: api.id,
        event_id: api.event_id,
        name: api.name,
        price: api.price,
        available: api.total_ticket - api.issued_ticket,
        sold: api.issued_ticket,
        checked_in: api.checked_in_ticket,
    };
}

/**
 * Aggregates ticket categories for one event into a dashboard summary.
 */
export function aggregateTicketDashboard(
    eventId: string,
    eventName: string,
    categories: TicketCategoryApiData[],
    brandSlug?: string,
): TicketDashboardSummary {
    let totalTickets = 0;
    let soldTickets = 0;
    let checkedInTickets = 0;

    for (const cat of categories) {
        totalTickets += cat.total_ticket;
        soldTickets += cat.issued_ticket;
        checkedInTickets += cat.checked_in_ticket;
    }

    return {
        event_id: eventId,
        event_name: eventName,
        brand_slug: brandSlug,
        total_tickets: totalTickets,
        available_tickets: totalTickets - soldTickets,
        sold_tickets: soldTickets,
        checked_in_tickets: checkedInTickets,
    };
}
