import { internalHttpClient } from "~/core/api";

export type ScanCodeType = "QR_CODE" | "BARCODE";

export interface CheckInRequest {
  code_hash: string;
  code_type: ScanCodeType;
  verify_by: string;
  expected_category_id?: string;
}

export interface CheckInResponse {
  id?: string;
  ticketId?: string;
  checkInTime?: string;
  check_in_time?: string;
  message?: string;
  source?: "TIKETBISA" | "PARTNER";
  ticket_category_id?: string;
  partner?: string;
}

export interface ValidateRequest {
  code_hash: string;
  code_type: ScanCodeType;
  expected_category_id?: string;
}

export type ValidateStatus = "VALID" | "ALREADY_CHECKED_IN" | "INVALID" | "WRONG_CATEGORY";

export interface ValidateResponse {
  status: ValidateStatus;
  holder_name?: string;
  ticket_category_name?: string;
  check_in_time?: string;
  source?: "TIKETBISA" | "PARTNER";
  partner?: string;
  message?: string;
}

export const checkinApi = {
  checkIn: (request: CheckInRequest) =>
    internalHttpClient.post<CheckInResponse>("/transaction/checkin", request),

  validate: (codeHash: string, codeType: ScanCodeType, expectedCategoryId?: string) =>
    internalHttpClient.post<ValidateResponse>("/transaction/scan/validate", {
      code_hash: codeHash,
      code_type: codeType,
      expected_category_id: expectedCategoryId,
    } satisfies ValidateRequest),
};
