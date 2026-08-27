import { describe, expect, it } from "vitest";
import { headers } from "./root";

describe("root response headers", () => {
  it("prevents a deployment from reusing an outdated application shell", () => {
    expect(headers()).toEqual({
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });
  });
});
