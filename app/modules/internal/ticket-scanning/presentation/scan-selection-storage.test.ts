// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  persistAutoCheckIn,
  persistScanSelection,
  readAutoCheckIn,
  readScanSelection,
} from "./scan-selection-storage";

const selection = {
  eventId: "event-1",
  eventName: "Konser",
  categories: [{ id: "category-1", name: "Regular" }, { id: "category-2", name: "Komunitas" }],
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

  it("migrates a legacy single category selection", () => {
    sessionStorage.setItem("tiketbisa_scan_category:brand-1", JSON.stringify({
      eventId: "event-1", eventName: "Konser", categoryId: "cat-1", categoryName: "Regular",
    }));
    expect(readScanSelection("brand-1", sessionStorage)).toEqual({
      eventId: "event-1", eventName: "Konser", categories: [{ id: "cat-1", name: "Regular" }],
    });
  });

  it("restores the auto check-in preference per brand", () => {
    persistAutoCheckIn(true, "brand-1", sessionStorage);
    expect(readAutoCheckIn("brand-1", sessionStorage)).toBe(true);
    expect(readAutoCheckIn("brand-2", sessionStorage)).toBe(false);
  });

  it("defaults auto check-in to off once turned back off", () => {
    persistAutoCheckIn(true, "brand-1", sessionStorage);
    persistAutoCheckIn(false, "brand-1", sessionStorage);
    expect(readAutoCheckIn("brand-1", sessionStorage)).toBe(false);
  });
});
