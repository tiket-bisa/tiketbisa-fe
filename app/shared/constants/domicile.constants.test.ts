import { describe, expect, it } from "vitest";

import {
  HOME_DOMICILE_OPTIONS,
  INDONESIAN_PROVINCES,
  normalizeHomeDomicile,
} from "./domicile.constants";

describe("domicile constants", () => {
  it("contains all 38 canonical Indonesian provinces without duplicates", () => {
    expect(INDONESIAN_PROVINCES).toHaveLength(38);
    expect(new Set(INDONESIAN_PROVINCES).size).toBe(38);
    expect(HOME_DOMICILE_OPTIONS).toContainEqual({
      value: "Papua Barat Daya",
      label: "Papua Barat Daya (Provinsi)",
    });
  });

  it("normalizes known legacy brand domicile values", () => {
    expect(normalizeHomeDomicile(" Jakarta ")).toBe("DKI Jakarta");
    expect(normalizeHomeDomicile("Solo")).toBe("Surakarta");
    expect(normalizeHomeDomicile("Palangkaraya")).toBe("Palangka Raya");
    expect(normalizeHomeDomicile("Bandung")).toBe("Bandung");
  });
});
