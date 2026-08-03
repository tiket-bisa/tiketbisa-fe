import { describe, expect, it } from "vitest";
import { normalizeIndonesianPhone } from "./phone";

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
});
