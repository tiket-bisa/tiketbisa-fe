// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import CreateTicketPage from "./create-ticket.page";

vi.mock("react-router", () => ({
  useParams: () => ({ eventId: "event-1" }),
  useNavigate: () => vi.fn(),
}));
vi.mock("~/core/auth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("~/core/api/services/ticket-category.api", () => ({
  ticketCategoryApi: { create: vi.fn() },
}));

afterEach(cleanup);

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
