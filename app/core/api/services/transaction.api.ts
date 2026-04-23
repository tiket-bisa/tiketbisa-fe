import { httpClient } from "../http-client";

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

export const transactionApi = {
    /** Get single transaction status */
    getStatus: (id: string) =>
        httpClient.get<unknown>(`/transaction/${id}`),

    /** Check in ticket by scanning */
    checkIn: (request: CheckInRequest) =>
        httpClient.post<CheckInResponse>("/transaction/checkin", request),
};
