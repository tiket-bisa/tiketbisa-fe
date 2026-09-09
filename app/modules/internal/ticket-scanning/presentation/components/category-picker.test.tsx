// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CategoryPicker } from "./category-picker";

vi.mock("../hooks/use-category-picker", () => ({
  useCategoryPicker: () => ({ events: [{ id: "event", name: "Match" }, { id: "other", name: "Other" }], loading: false }),
  useEventCategories: () => ({ categories: [
    { id: "A", name: "Barat A", event_id: "event" },
    { id: "B", name: "Barat A (Komunitas)", event_id: "event" },
    { id: "C", name: "Ekonomi D", event_id: "other" },
  ], loading: false }),
}));
afterEach(cleanup);

it("selects multiple categories and clears them when the event changes", () => {
  const onChange = vi.fn();
  render(<CategoryPicker selected={null} onChange={onChange} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "event" } });
  fireEvent.click(screen.getByLabelText("Barat A"));
  fireEvent.click(screen.getByLabelText("Barat A (Komunitas)"));
  fireEvent.change(screen.getByLabelText("Cari kategori"), { target: { value: "Komunitas" } });
  fireEvent.click(screen.getByText("Terapkan"));
  expect(onChange).toHaveBeenLastCalledWith({ eventId: "event", eventName: "Match", categories: [
    { id: "A", name: "Barat A" }, { id: "B", name: "Barat A (Komunitas)" },
  ] });
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "other" } });
  expect((screen.getByText("Terapkan") as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByLabelText("Ekonomi D") as HTMLInputElement).checked).toBe(false);
});
