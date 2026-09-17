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

export const preGeneratedCodeApi = {
  /** Tops every category of the event up to a full set of codes for the seats it still has. */
  generateForEvent: (eventId: string, codeType: "QR_CODE" | "BARCODE" = "QR_CODE") =>
    internalHttpClient.post<PreGenerateResult>(
      `/pre-generated-code/event/${eventId}?codeType=${codeType}`,
      {},
    ),

  listForEvent: (eventId: string) =>
    internalHttpClient.get<PreGeneratedCodeList>(`/pre-generated-code/event/${eventId}`),
};

/**
 * CSV for handing to the offline scanner operator.
 *
 * Every field is quoted and embedded quotes are doubled: a category name carrying a comma would
 * otherwise shift every later column, and the file is loaded into someone else's system where a
 * silently misaligned row means a valid ticket that will not scan.
 */
export function buildPreGeneratedCodeCsv(
  codes: PreGeneratedCode[],
  categoryNameById: Record<string, string> = {},
): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = ["Kategori", "Kode", "Tipe", "Status"].map(escape).join(",");
  const rows = codes.map((code) => [
    escape(categoryNameById[code.ticketCategoryId] ?? code.ticketCategoryId),
    escape(code.codeHash),
    escape(code.codeType ?? ""),
    escape(code.status ?? ""),
  ].join(","));
  return [header, ...rows].join("\n");
}
