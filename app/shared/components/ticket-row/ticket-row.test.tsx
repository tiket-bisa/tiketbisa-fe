// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TicketRow } from "./ticket-row";

afterEach(cleanup);

describe("TicketRow", () => {
  it("keeps the full category name and status on separate rows", () => {
    render(
      <TicketRow
        ticket={{
          id: "category-1",
          name: "Tribun Barat A dengan Nama Kategori Panjang",
          price: 12000,
          available: true,
        }}
        quantity={0}
        onQuantityChange={vi.fn()}
      />,
    );

    const categoryName = screen.getByText("Tribun Barat A dengan Nama Kategori Panjang");
    const status = screen.getByText("Tersedia");

    expect(categoryName.textContent).toBe("Tribun Barat A dengan Nama Kategori Panjang");
    expect(categoryName.parentElement).not.toBe(status.parentElement);
    expect(categoryName.parentElement?.getAttribute("title")).toBe(
      "Tribun Barat A dengan Nama Kategori Panjang",
    );
  });

  it("keeps the quantity controls usable", () => {
    const onQuantityChange = vi.fn();
    render(
      <TicketRow
        ticket={{
          id: "category-1",
          name: "Tribun Barat A",
          price: 12000,
          available: true,
        }}
        quantity={0}
        onQuantityChange={onQuantityChange}
      />,
    );

    screen.getByRole("button", { name: "Increase" }).click();
    expect(onQuantityChange).toHaveBeenCalledWith("category-1", 1);
  });

  it("animates only when the category name overflows its viewport", () => {
    render(
      <TicketRow
        ticket={{
          id: "category-1",
          name: "Tribun Barat A dengan Nama Kategori Panjang",
          price: 12000,
          available: true,
        }}
        quantity={0}
        onQuantityChange={vi.fn()}
      />,
    );

    const categoryName = screen.getByText("Tribun Barat A dengan Nama Kategori Panjang");
    Object.defineProperty(categoryName, "scrollWidth", { configurable: true, value: 240 });
    Object.defineProperty(categoryName.parentElement, "clientWidth", { configurable: true, value: 120 });

    act(() => window.dispatchEvent(new Event("resize")));

    expect(categoryName.classList.contains("animate-ticket-name-scroll")).toBe(true);
    expect(categoryName.getAttribute("style")).toContain("--ticket-name-overflow: 120px");
  });
});
