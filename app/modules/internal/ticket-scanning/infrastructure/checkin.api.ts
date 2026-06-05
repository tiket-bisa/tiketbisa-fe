import { internalHttpClient } from "~/core/api";

export interface CheckInRequest {
  code_hash: string;
  code_type: "QR_CODE" | "BARCODE";
  verify_by: string;
}

export interface CheckInResponse {
  id?: string;
  ticketId?: string;
  checkInTime?: string;
  check_in_time?: string;
  message?: string;
}

export const checkinApi = {
  checkIn: (request: CheckInRequest) =>
    internalHttpClient.post<CheckInResponse>("/transaction/checkin", request),
};
