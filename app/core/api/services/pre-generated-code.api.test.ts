import { describe, expect, it } from "vitest";

import { buildTicketCodeExportCsv, type TicketCodeExportRow } from "./pre-generated-code.api";

const code = (overrides: Partial<TicketCodeExportRow> = {}): TicketCodeExportRow => ({
  codeHash: "TKB-AbCdEf1234",
  categoryName: "Tribun Barat A",
  issuedAt: "2026-09-22T03:15:00Z",
  ...overrides,
});

describe("buildTicketCodeExportCsv", () => {
  it("writes the scanner export columns and one row per code", () => {
    const csv = buildTicketCodeExportCsv([code()]);
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe('"Kode Hash","Kategori","Issued At"');
    expect(lines[1]).toBe('"TKB-AbCdEf1234","Tribun Barat A","2026-09-22T03:15:00Z"');
    expect(lines).toHaveLength(2);
  });

  it("quotes commas and doubles embedded quotes", () => {
    const csv = buildTicketCodeExportCsv([
      code({ categoryName: 'Tribun "VIP", Gate 3' }),
    ]);

    expect(csv.split("\r\n")[1]).toBe(
      '"TKB-AbCdEf1234","Tribun ""VIP"", Gate 3","2026-09-22T03:15:00Z"',
    );
  });

  it("leaves issued at blank for an available pre-generated code", () => {
    const csv = buildTicketCodeExportCsv([code({ issuedAt: null })]);

    expect(csv.split("\r\n")[1]).toBe('"TKB-AbCdEf1234","Tribun Barat A",""');
  });

  it("neutralizes spreadsheet formulas in exported text", () => {
    const csv = buildTicketCodeExportCsv([
      code({ codeHash: "=HYPERLINK(1)", categoryName: "+VIP" }),
    ]);

    expect(csv.split("\r\n")[1]).toContain('"\'=HYPERLINK(1)","\'+VIP"');
  });
});
