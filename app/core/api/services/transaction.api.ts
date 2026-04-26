import { httpClient, internalHttpClient } from "../http-client";

/* ── API functions ── */

export interface CheckInRequest {
    code_hash: string;
    code_type: "QR_CODE" | "BARCODE";
    verify_by: string;
}

export interface CheckInResponse {
    ticketId: string;
    checkInTime: string;
    message: string;
}

export interface TransactionApiData {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    totalPrice: number;
    status: string;
    paymentMethod: string;
    paymentDate: string;
    created: string;
}

export interface TransactionTicketDetail {
    category: {
        id: string;
        eventId: string;
        name: string;
        price: number;
    };
    issuedTickets: any[];
    ticketCount: number;
    subtotalPrice: number;
}

export interface TransactionDetailResponse {
    transaction: TransactionApiData;
    ticketDetails: TransactionTicketDetail[];
}

export interface TransactionListResponse {
    transactions: TransactionApiData[];
    total_count: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
    has_next_page: boolean;
    has_previous_page: boolean;
}

export interface TransactionListParams {
    limit?: number;
    offset?: number;
    brandId?: string;
    eventId?: string;
    status?: string;
    customerName?: string;
}

function buildQuery(params?: TransactionListParams): string {
    if (!params) return "";
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set("limit", String(params.limit));
    if (params.offset != null) qs.set("offset", String(params.offset));
    if (params.brandId) qs.set("brandId", params.brandId);
    if (params.eventId) qs.set("eventId", params.eventId);
    if (params.status) qs.set("status", params.status);
    if (params.customerName) qs.set("customerName", params.customerName);
    const str = qs.toString();
    return str ? `?${str}` : "";
}

export const transactionApi = {
    /** Get transaction list */
    getList: (params?: TransactionListParams) =>
        internalHttpClient.get<TransactionListResponse>(`/transaction/list${buildQuery(params)}`),
    
    /** Get detailed transaction */
    getDetail: (id: string) =>
        internalHttpClient.get<TransactionDetailResponse>(`/transaction/detail/${id}`),

    /** Get single transaction status */
    getStatus: (id: string) =>
        httpClient.get<unknown>(`/transaction/${id}`),

    /** Check in ticket by scanning */
    checkIn: (request: CheckInRequest) =>
        httpClient.post<CheckInResponse>("/transaction/checkin", request),
};

/* ── Mapper: BE → FE type ── */

import type { Transaction } from "~/core/types";

export function mapTransactionApiToFe(api: TransactionApiData): Transaction {
    // Convert BE status to FE status
    let feStatus: Transaction["status"] = "pending";
    if (api.status === "PAID" || api.status === "COMPLETED") feStatus = "paid";
    else if (api.status === "CANCELED" || api.status === "CANCELLED") feStatus = "cancelled";
    else if (api.status === "REFUNDED") feStatus = "refunded";
    
    return {
        id: api.id,
        event_id: "-", // Not returned in list API
        event_name: "-", // Not returned in list API
        brand_slug: "-", // Not returned in list API
        buyer_name: api.customerName ?? "-",
        buyer_email: api.customerEmail ?? "-",
        buyer_phone: api.customerPhone ?? "-",
        ticket_name: "-", // Not returned in list API
        quantity: 0, // Not returned in list API
        total_price: api.totalPrice ?? 0,
        status: feStatus,
        payment_method: api.paymentMethod,
        created_at: api.paymentDate ?? api.created ?? new Date().toISOString(),
    };
}

export function mapTransactionDetailApiToFe(api: TransactionDetailResponse): Transaction {
    const tx = api.transaction;
    
    // Extract first ticket info for display summary if exists
    let eventName = "-";
    let ticketName = "-";
    let quantity = 0;
    
    if (api.ticketDetails && api.ticketDetails.length > 0) {
        const firstDetail = api.ticketDetails[0];
        // Note: Event name might not be in ticket category natively, we fallback to "-" if so
        ticketName = firstDetail.category?.name ?? "-";
        
        for (const detail of api.ticketDetails) {
            quantity += detail.ticketCount ?? 0;
        }
    }

    let feStatus: Transaction["status"] = "pending";
    if (tx.status === "PAID" || tx.status === "COMPLETED") feStatus = "paid";
    else if (tx.status === "CANCELED" || tx.status === "CANCELLED") feStatus = "cancelled";
    else if (tx.status === "REFUNDED") feStatus = "refunded";
    
    return {
        id: tx.id,
        event_id: "-", // Not available directly
        event_name: eventName,
        brand_slug: "-", // Not available directly
        buyer_name: tx.customerName ?? "-",
        buyer_email: tx.customerEmail ?? "-",
        buyer_phone: tx.customerPhone ?? "-",
        ticket_name: ticketName,
        quantity: quantity,
        total_price: tx.totalPrice ?? 0,
        status: feStatus,
        payment_method: tx.paymentMethod,
        created_at: tx.paymentDate ?? tx.created ?? new Date().toISOString(),
    };
}
