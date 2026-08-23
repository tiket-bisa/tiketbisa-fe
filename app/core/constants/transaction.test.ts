import { describe, expect, it } from "vitest";
import { mapTransactionStatusFilterToApi, STATUS_MAP, statusFilterOptions } from "./transaction";

describe("transaction status configuration", () => {
  it("renders expired as a destructive status", () => {
    expect(STATUS_MAP.expired).toEqual({ label: "Expired", variant: "destructive" });
  });

  it("exposes an expired filter backed by EXPIRED", () => {
    expect(statusFilterOptions).toContainEqual({ value: "expired", label: "Expired" });
    expect(mapTransactionStatusFilterToApi("expired")).toBe("EXPIRED");
  });
});
