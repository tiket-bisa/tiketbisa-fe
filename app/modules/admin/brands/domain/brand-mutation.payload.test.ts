import { describe, expect, it } from "vitest";
import { buildBrandMutationPayload } from "./brand-mutation.payload";

const form = {
  name: "  Adhyaksa FC  ",
  logoPath: "",
  bannerPath: "",
  description: "  Klub sepak bola profesional  ",
  category: "sepak_bola",
  subCategory: "liga_1",
  sponsorPath: "",
};

describe("buildBrandMutationPayload", () => {
  it("includes a trimmed description for create and update requests", () => {
    expect(buildBrandMutationPayload(form, 5_000)).toMatchObject({
      name: "Adhyaksa FC",
      description: "Klub sepak bola profesional",
      adminFee: 5_000,
    });
  });

  it("sends null when description is cleared", () => {
    expect(buildBrandMutationPayload({ ...form, description: "  " }, 0).description).toBeNull();
  });
});
