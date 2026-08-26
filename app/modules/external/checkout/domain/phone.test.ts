import { describe, expect, it } from "vitest";
import { normalizeIndonesianPhone, validateIndonesianPhone } from "./phone";

describe("normalizeIndonesianPhone", () => {
  it("normalizes local Indonesian mobile numbers to E.164", () => {
    expect(normalizeIndonesianPhone("0812-3456-7890")).toBe("+6281234567890");
  });

  it("keeps valid +628 numbers", () => {
    expect(normalizeIndonesianPhone("+6281234567890")).toBe("+6281234567890");
  });

  it("rejects unrelated prefixes", () => {
    expect(normalizeIndonesianPhone("0215551234")).toBeNull();
    expect(normalizeIndonesianPhone("6281234567890")).toBeNull();
  });

  it("reports an excessive local number length instead of a format error", () => {
    expect(validateIndonesianPhone("08123123123123")).toEqual({
      normalized: null,
      error: "Nomor telepon format 08… harus terdiri dari 10–13 digit.",
    });
  });

  it("reports an excessive international number length", () => {
    expect(validateIndonesianPhone("+628123123123123")).toEqual({
      normalized: null,
      error: "Nomor telepon format +628… harus terdiri dari 11–14 digit.",
    });
  });
});
