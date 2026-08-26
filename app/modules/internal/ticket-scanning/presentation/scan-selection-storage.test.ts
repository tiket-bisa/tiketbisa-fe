// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { persistScanSelection, readScanSelection } from "./scan-selection-storage";

const selection = {
  eventId: "event-1",
  eventName: "Konser",
  categoryId: "category-1",
  categoryName: "Regular",
};

describe("scan selection storage", () => {
  beforeEach(() => sessionStorage.clear());

  it("restores the active event and category for the same brand", () => {
    persistScanSelection(selection, "brand-1", sessionStorage);
    expect(readScanSelection("brand-1", sessionStorage)).toEqual(selection);
    expect(readScanSelection("brand-2", sessionStorage)).toBeNull();
  });

  it("clears the persisted selection when the operator changes category", () => {
    persistScanSelection(selection, "brand-1", sessionStorage);
    persistScanSelection(null, "brand-1", sessionStorage);
    expect(readScanSelection("brand-1", sessionStorage)).toBeNull();
  });

  it("ignores malformed or incomplete stored state", () => {
    sessionStorage.setItem("tiketbisa_scan_category:brand-1", JSON.stringify({ eventId: "event-1" }));
    expect(readScanSelection("brand-1", sessionStorage)).toBeNull();
  });
});
