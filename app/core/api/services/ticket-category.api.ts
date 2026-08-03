import { httpClient, internalHttpClient } from "../http-client";

/* ── BE data shapes ── */

export interface TicketCategoryApiData {
    id: string;
    event_id: string;
    eventId?: string;
    name: string;
    description: string | null;
    total_ticket: number;
    totalTicket?: number;
    issued_ticket: number;
    issuedTicket?: number;
    checked_in_ticket: number;
    checkedInTicket?: number;
    price: number;
    created: string | null;
}

type RawTicketCategory = Partial<TicketCategoryApiData>;

export function normalizeTicketCategory(api: RawTicketCategory): TicketCategoryApiData {
    return {
        id: String(api.id ?? ""),
        event_id: String(api.event_id ?? api.eventId ?? ""),
        name: String(api.name ?? ""),
        description: (api.description ?? null) as string | null,
        total_ticket: Number(api.total_ticket ?? api.totalTicket ?? 0),
        issued_ticket: Number(api.issued_ticket ?? api.issuedTicket ?? 0),
        checked_in_ticket: Number(api.checked_in_ticket ?? api.checkedInTicket ?? 0),
        price: Number(api.price ?? 0),
        created: (api.created ?? null) as string | null,
    };
}

export interface TicketCategoryListResponse {
    ticket_categories?: TicketCategoryApiData[];
    total_count: number;
    limit: number;
    offset: number;
}

/* ── API functions ── */

export const ticketCategoryApi = {
    getByEvent: async (eventId: string) => {
        const response = await httpClient.get<RawTicketCategory[]>(`/ticket-category/event/${eventId}`);
        return { ...response, data: response.data ? response.data.map(normalizeTicketCategory) : response.data };
    },

    getById: async (id: string) => {
        const response = await httpClient.get<RawTicketCategory>(`/ticket-category/${id}`);
        return { ...response, data: response.data ? normalizeTicketCategory(response.data) : response.data };
    },

    getList: (params?: { limit?: number; offset?: number }) => {
        const qs = new URLSearchParams();
        if (params?.limit != null) qs.set("limit", String(params.limit));
        if (params?.offset != null) qs.set("offset", String(params.offset));
        const str = qs.toString();
        return httpClient.get<TicketCategoryListResponse>(
            `/ticket-category${str ? `?${str}` : ""}`,
        ).then((response) => ({
            ...response,
            data: response.data ? {
                ...response.data,
                ticket_categories: (response.data.ticket_categories ?? []).map(normalizeTicketCategory),
            } : response.data,
        }));
    },

    create: (data: { eventId: string; name: string; description?: string; categoryCode: string; totalTicket: number; price: number }) =>
        internalHttpClient.post<TicketCategoryApiData>("/ticket-category", data),
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
