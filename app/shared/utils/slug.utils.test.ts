import { describe, it, expect } from "vitest";
import { slugify } from "./slug.utils";

describe("slugify", () => {
  it("converts standard uppercase and mixed case names to lowercase hyphens", () => {
    expect(slugify("DE RED FC")).toBe("de-red-fc");
    expect(slugify("DE RED FC VS KENDAL TORNADO FC")).toBe("de-red-fc-vs-kendal-tornado-fc");
  });

  it("handles punctuation, accents, and special characters", () => {
    expect(slugify("TiketBisa Festival 2026!")).toBe("tiketbisa-festival-2026");
    expect(slugify("Music & Arts Fest")).toBe("music-arts-fest");
    expect(slugify("  Persib vs Persija: Derby Panas!  ")).toBe("persib-vs-persija-derby-panas");
  });

  it("handles multiple consecutive spaces or hyphens", () => {
    expect(slugify("Rock   In---Solo")).toBe("rock-in-solo");
  });

  it("handles null, undefined, and empty strings gracefully", () => {
    expect(slugify(null)).toBe("");
    expect(slugify(undefined)).toBe("");
    expect(slugify("")).toBe("");
    expect(slugify("   ")).toBe("");
  });
});
