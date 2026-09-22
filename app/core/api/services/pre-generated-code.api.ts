import { internalHttpClient } from "../http-client";

export interface PreGenerateCategorySummary {
  categoryId: string;
  categoryName: string;
  remainingSeats: number;
  alreadyAvailable: number;
  generated: number;
}

export interface PreGenerateResult {
  eventId: string;
  codeType: string;
  totalGenerated: number;
  categories: PreGenerateCategorySummary[];
}

export interface PreGeneratedCode {
  ticketCategoryId: string;
  codeHash: string;
  codeType: string | null;
  status: string | null;
  usedAt: string | null;
}

export interface PreGeneratedCodeList {
  eventId: string;
  totalCount: number;
  codes: PreGeneratedCode[];
}

export interface TicketCodeExportRow {
  codeHash: string;
  categoryName: string;
  issuedAt: string | null;
}

export interface TicketCodeExportList {
  eventId: string;
  totalCount: number;
  codes: TicketCodeExportRow[];
}

export const preGeneratedCodeApi = {
  /** Tops every category of the event up to a full set of codes for the seats it still has. */
  generateForEvent: (eventId: string, codeType: "QR_CODE" | "BARCODE" = "QR_CODE") =>
    internalHttpClient.post<PreGenerateResult>(
      `/pre-generated-code/event/${eventId}?codeType=${codeType}`,
      {},
    ),

  listForEvent: (eventId: string) =>
    internalHttpClient.get<PreGeneratedCodeList>(`/pre-generated-code/event/${eventId}`),

  exportForEvent: (eventId: string) =>
    internalHttpClient.get<TicketCodeExportList>(`/pre-generated-code/event/${eventId}/export`),
};

export function buildTicketCodeExportCsv(codes: TicketCodeExportRow[]): string {
  const escape = (value: string) => {
    const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safeValue.replace(/"/g, '""')}"`;
  };
  const header = ["Kode Hash", "Kategori", "Issued At"].map(escape).join(",");
  const rows = codes.map((code) => [
    escape(code.codeHash),
    escape(code.categoryName),
    escape(code.issuedAt ?? ""),
  ].join(","));
  return [header, ...rows].join("\r\n");
}
