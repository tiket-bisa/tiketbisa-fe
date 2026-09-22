import { describe, expect, it } from "vitest";

import { buildPreGeneratedCodeCsv, type PreGeneratedCode } from "./pre-generated-code.api";

const code = (overrides: Partial<PreGeneratedCode> = {}): PreGeneratedCode => ({
  ticketCategoryId: "cat-1",
  codeHash: "TKB-AbCdEf1234",
  codeType: "QR_CODE",
  status: "AVAILABLE",
  usedAt: null,
  ...overrides,
});

describe("buildPreGeneratedCodeCsv", () => {
  it("writes a header and one row per code", () => {
    const csv = buildPreGeneratedCodeCsv([code()], { "cat-1": "Tribun Barat A" });
    const lines = csv.split("\n");

    expect(lines[0]).toBe('"Kategori","Kode","Tipe","Status"');
    expect(lines[1]).toBe('"Tribun Barat A","TKB-AbCdEf1234","QR_CODE","AVAILABLE"');
    expect(lines).toHaveLength(2);
  });

  it("quotes a category name containing a comma instead of shifting every later column", () => {
    // The file is loaded into someone else's system, where a silently misaligned row is a valid
    // ticket that will not scan at the gate.
    const csv = buildPreGeneratedCodeCsv([code()], { "cat-1": "Tribun Barat A, Gate 3" });

    expect(csv.split("\n")[1]).toBe('"Tribun Barat A, Gate 3","TKB-AbCdEf1234","QR_CODE","AVAILABLE"');
  });

  it("doubles an embedded quote so the field does not terminate early", () => {
    const csv = buildPreGeneratedCodeCsv([code()], { "cat-1": 'Tribun "VIP"' });

    expect(csv.split("\n")[1]).toContain('"Tribun ""VIP"""');
  });

  it("falls back to the category id when the name is unknown", () => {
    const csv = buildPreGeneratedCodeCsv([code()]);

    expect(csv.split("\n")[1]).toContain('"cat-1"');
  });

  it("writes empty fields rather than the string null for a code missing its type or status", () => {
    const csv = buildPreGeneratedCodeCsv([code({ codeType: null, status: null })], {});

    expect(csv.split("\n")[1]).toBe('"cat-1","TKB-AbCdEf1234","",""');
  });
});
