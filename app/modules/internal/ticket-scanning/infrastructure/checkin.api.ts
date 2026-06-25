import { internalHttpClient } from "~/core/api";

export interface CheckInRequest {
  code_hash: string;
  code_type: "QR_CODE" | "BARCODE";
  verify_by: string;
  event_id: string;
  ticket_category_id: string;
}

export interface CheckInResponse {
  id?: string;
  ticketId?: string;
  ticket_id?: string;
  eventId?: string;
  event_id?: string;
  eventName?: string;
  event_name?: string;
  ticketCategoryId?: string;
  ticket_category_id?: string;
  ticketCategoryName?: string;
  ticket_category_name?: string;
  buyerName?: string;
  buyer_name?: string;
  checkInTime?: string;
  check_in_time?: string;
  message?: string;
}

export const checkinApi = {
  checkIn: (request: CheckInRequest) =>
    internalHttpClient.post<CheckInResponse>("/transaction/checkin", request),
};
