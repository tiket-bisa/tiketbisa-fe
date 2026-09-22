// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import CreateTicketPage from "./create-ticket.page";

const mocks = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock("react-router", () => ({
  useParams: () => ({ eventId: "event-1" }),
  useNavigate: () => vi.fn(),
}));
vi.mock("~/core/auth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("~/core/api/services/ticket-category.api", () => ({
  ticketCategoryApi: { create: mocks.create },
}));

afterEach(() => {
  cleanup();
  mocks.create.mockReset();
});

it("locks bulk ticket price to a visibly disabled zero value", () => {
  render(<CreateTicketPage />);
  const price = screen.getByLabelText(/^Harga \(Rp\)/) as HTMLInputElement;

  expect(price.disabled).toBe(false);
  fireEvent.click(screen.getByLabelText("Bulk"));
  expect(price.disabled).toBe(true);
  expect(price.value).toBe("0");
  expect(price.className).toContain("disabled:border-gray-400");
  expect(price.className).toContain("disabled:bg-gray-100");

  fireEvent.click(screen.getByLabelText("Reguler"));
  expect(price.disabled).toBe(false);
});

it("creates a bundled category with its physical bundle size", async () => {
  mocks.create.mockResolvedValue({ success: true, data: { id: "bundle-1" } });
  render(<CreateTicketPage />);

  fireEvent.click(screen.getByLabelText("Bundling"));
  fireEvent.change(screen.getByLabelText(/^Nama Tiket/), { target: { value: "VIP Family 3" } });
  fireEvent.change(screen.getByLabelText(/^Kode Kategori/), { target: { value: "VF3" } });
  fireEvent.change(screen.getByLabelText(/^Harga \(Rp\)/), { target: { value: "300000" } });
  fireEvent.change(screen.getByLabelText(/^Jumlah Tiket/), { target: { value: "300" } });
  fireEvent.change(screen.getByLabelText(/^Jumlah bundling/), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Simpan Tiket" }));

  await vi.waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
    eventId: "event-1",
    bundleSize: 3,
    totalTicket: 300,
    price: 300000,
  })));
});
