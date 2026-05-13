import { httpClient, internalHttpClient } from "../http-client";
import { toAbsoluteApiUrl } from "../api-url";

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
    paymentProofPath?: string | null;
    verifiedBy?: string | null;
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

export interface PaymentProofResponse {
    fileName: string;
    mimeType: string;
    base64Content: string;
    signedUrl?: string;
}

export interface TransactionListResponse {
    transactions: TransactionApiData[];
    totalCount?: number;
    total_count?: number;
    limit: number;
    offset: number;
    totalPages?: number;
    total_pages?: number;
    currentPage?: number;
    current_page?: number;
    hasNextPage?: boolean;
    has_next_page?: boolean;
    hasPreviousPage?: boolean;
    has_previous_page?: boolean;
}

export interface TransactionListParams {
    limit?: number;
    offset?: number;
    brandId?: string;
    eventId?: string;
    status?: string;
    customerName?: string;
}

export interface ManualTransferReviewRequest {
    action: "APPROVE" | "REJECT";
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

    /** Get payment proof from manual transfer transaction */
    getPaymentProof: (id: string) =>
        internalHttpClient.get<PaymentProofResponse>(`/transaction/detail/${id}/payment-proof`),

    /** Download payment proof as blob */
    downloadPaymentProof: async (id: string): Promise<{ success: boolean; data: { fileName: string; mimeType: string; blob: Blob } | null; error: string | null }> => {
        const stored = localStorage.getItem("tiketbisa_auth");
        const session = stored ? JSON.parse(stored) : {};
        const headers: Record<string, string> = {
            "x-tb-identifier": session.email || "",
            "x-tb-internal-token": session.internal_token || "",
        };
        
        try {
            const url = toAbsoluteApiUrl(`/internal-tb/transaction/detail/${id}/payment-proof/download`);
            
            const response = await fetch(url, { headers });
            
            if (!response.ok) {
                return { success: false, data: null, error: `HTTP ${response.status}` };
            }
            
            const contentDisposition = response.headers.get("Content-Disposition") || "";
            const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
            const fileName = fileNameMatch ? fileNameMatch[1] : `payment-proof-${id}`;
            const mimeType = response.headers.get("Content-Type") || "application/octet-stream";
            
            const blob = await response.blob();
            
            return { success: true, data: { fileName, mimeType, blob }, error: null };
        } catch (e) {
            return { success: false, data: null, error: e instanceof Error ? e.message : "Download failed" };
        }
    },

    /** Review manual transfer transaction */
    reviewManualTransfer: (id: string, request: ManualTransferReviewRequest) =>
        internalHttpClient.post<TransactionApiData>(`/transaction/detail/${id}/review`, request),

    /** Get single transaction status */
    getStatus: (id: string) =>
        httpClient.get<unknown>(`/transaction/${id}`),

    /** Check in ticket by scanning */
    checkIn: (request: CheckInRequest) =>
        httpClient.post<CheckInResponse>("/transaction/checkin", request),
};

/* ── Mapper: BE → FE type ── */

import type { Transaction } from "~/core/types";

function mapBackendStatus(status: string | undefined): Transaction["status"] {
    const normalizedStatus = (status ?? "").toUpperCase();
    if (normalizedStatus === "PAID" || normalizedStatus === "COMPLETED") return "paid";
    if (normalizedStatus === "WAITING_PAYMENT" || normalizedStatus === "WAITING_APPROVAL") return "pending";
    if (normalizedStatus === "CANCELED" || normalizedStatus === "CANCELLED") return "cancelled";
    if (normalizedStatus === "REFUNDED") return "refunded";
    return "pending";
}

export function mapTransactionApiToFe(api: TransactionApiData): Transaction {
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
        status: mapBackendStatus(api.status),
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
        status: mapBackendStatus(tx.status),
        payment_method: tx.paymentMethod,
        created_at: tx.paymentDate ?? tx.created ?? new Date().toISOString(),
    };
}
