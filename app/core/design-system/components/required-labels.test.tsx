// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Input } from "./input";
import { Select } from "./select";
import { SearchableCitySelect } from "~/modules/internal/events/presentation/components/searchable-city-select";

afterEach(cleanup);

describe("required field labels", () => {
  it("shows a red visual marker for required Input and Select fields", () => {
    render(
      <>
        <Input label="Nama Event" required />
        <Select label="Brand" required options={[]} />
        <Input label="Deskripsi" />
      </>,
    );

    const name = screen.getByLabelText(/^Nama Event/);
    const brand = screen.getByLabelText(/^Brand/);
    const description = screen.getByLabelText("Deskripsi");
    expect(name.hasAttribute("required")).toBe(true);
    expect(brand.hasAttribute("required")).toBe(true);
    expect(description.hasAttribute("required")).toBe(false);
    expect(name.previousElementSibling?.querySelector("span")?.className).toContain("text-destructive-text");
    expect(brand.parentElement?.previousElementSibling?.querySelector("span")?.className).toContain("text-destructive-text");
    expect(description.previousElementSibling?.querySelector("span")).toBeNull();
  });

  it("shows the same marker on the required searchable city field", () => {
    render(<SearchableCitySelect value="" onChange={() => {}} required />);

    const city = screen.getByLabelText(/^Kota/);
    expect(city.hasAttribute("required")).toBe(true);
    expect(city.parentElement?.previousElementSibling?.querySelector("span")?.className).toContain("text-destructive-text");
  });
});
