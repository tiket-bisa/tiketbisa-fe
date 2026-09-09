// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CategoryPicker } from "./category-picker";

const hookState = vi.hoisted(() => ({
  categoryError: null as string | null,
  refetchCategories: vi.fn(),
}));

vi.mock("../hooks/use-category-picker", () => ({
  useCategoryPicker: () => ({ events: [{ id: "event", name: "Match" }, { id: "other", name: "Other" }], loading: false }),
  useEventCategories: () => ({ categories: [
    { id: "A", name: "Barat A", event_id: "event" },
    { id: "B", name: "Barat A (Komunitas)", event_id: "event" },
    { id: "C", name: "Ekonomi D", event_id: "other" },
  ], loading: false, error: hookState.categoryError, refetch: hookState.refetchCategories }),
}));
afterEach(() => {
  cleanup();
  hookState.categoryError = null;
  hookState.refetchCategories.mockReset();
});

it("selects multiple categories and clears them when the event changes", () => {
  const onChange = vi.fn();
  render(<CategoryPicker selected={null} onChange={onChange} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "event" } });
  const categoryList = screen.getByLabelText("Barat A").closest("div.grid");
  expect(categoryList?.className).toContain("grid-cols-1");
  expect(categoryList?.className).toContain("sm:grid-cols-2");
  expect(categoryList?.className).toContain("lg:grid-cols-3");
  expect(categoryList?.parentElement?.className).toContain("max-h-64");
  expect(screen.getByText("0 dipilih")).toBeTruthy();
  fireEvent.click(screen.getByLabelText("Barat A"));
  fireEvent.click(screen.getByLabelText("Barat A (Komunitas)"));
  expect(screen.getByText("2 dipilih")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Cari kategori"), { target: { value: "Komunitas" } });
  fireEvent.click(screen.getByText("Terapkan"));
  expect(onChange).toHaveBeenLastCalledWith({ eventId: "event", eventName: "Match", categories: [
    { id: "A", name: "Barat A" }, { id: "B", name: "Barat A (Komunitas)" },
  ] });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "other" } });
  expect((screen.getByText("Terapkan") as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByLabelText("Ekonomi D") as HTMLInputElement).checked).toBe(false);
});

it("shows active categories as wrapping chips", () => {
  render(<CategoryPicker selected={{
    eventId: "event",
    eventName: "Match",
    categories: [{ id: "A", name: "Barat A" }, { id: "B", name: "Barat A (Komunitas)" }],
  }} onChange={vi.fn()} />);
  const chips = screen.getByLabelText("Kategori terpilih");
  expect(chips.className).toContain("flex-wrap");
  expect(screen.getByText("Barat A")).toBeTruthy();
  expect(screen.getByText("Barat A (Komunitas)")).toBeTruthy();
});

it("shows category loading failures and lets the scanner retry", () => {
  hookState.categoryError = "Permintaan tidak dapat diproses.";
  render(<CategoryPicker selected={null} onChange={vi.fn()} />);

  fireEvent.change(screen.getByRole("combobox"), { target: { value: "event" } });

  expect(screen.getByRole("alert").textContent).toContain("Permintaan tidak dapat diproses.");
  fireEvent.click(screen.getByRole("button", { name: "Coba Lagi" }));
  expect(hookState.refetchCategories).toHaveBeenCalledOnce();
  expect((screen.getByText("Terapkan") as HTMLButtonElement).disabled).toBe(true);
});
