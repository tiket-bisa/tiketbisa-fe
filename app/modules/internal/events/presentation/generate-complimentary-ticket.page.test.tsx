// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GenerateBulkTicketPage from "./generate-complimentary-ticket.page";

const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useParams: () => ({ eventId: "event-1" }),
  useNavigate: () => mockNavigate,
}));

vi.mock("~/core/auth", () => ({
  useAuth: () => ({ user: { role: "admin" } }),
}));

const mockGetById = vi.fn();
vi.mock("~/core/api/services/internal-event.api", () => ({
  internalEventApi: {
    getById: (...args: unknown[]) => mockGetById(...args),
  },
  normalizeInternalEvent: (data: unknown) => data,
}));

const mockGetInternalByEvent = vi.fn();
vi.mock("~/core/api/services/ticket-category.api", () => ({
  ticketCategoryApi: {
    getInternalByEvent: (...args: unknown[]) => mockGetInternalByEvent(...args),
  },
  mapTicketCategoryToFe: (data: any) => ({
    id: data.id,
    name: data.name,
    price: data.price ?? 0,
    available: (data.total_ticket ?? data.totalTicket ?? 10) - (data.issued_ticket ?? data.issuedTicket ?? 0),
    is_hidden: true,
  }),
}));

const mockManualGenerateTickets = vi.fn();
const mockGetDetail = vi.fn();
const mockDownloadTickets = vi.fn();
const mockDownloadTicketPdf = vi.fn();
const mockEmailTicketPdf = vi.fn();

vi.mock("~/core/api/services/transaction.api", () => ({
  transactionApi: {
    manualGenerateTickets: (...args: unknown[]) => mockManualGenerateTickets(...args),
    getDetail: (...args: unknown[]) => mockGetDetail(...args),
    downloadTickets: (...args: unknown[]) => mockDownloadTickets(...args),
    downloadTicketPdf: (...args: unknown[]) => mockDownloadTicketPdf(...args),
    emailTicketPdf: (...args: unknown[]) => mockEmailTicketPdf(...args),
  },
}));

describe("GenerateBulkTicketPage (TIK-14 Multi-Category)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetById.mockResolvedValue({
      success: true,
      data: {
        id: "event-1",
        name: "Final Cup 2026",
        status: "ONGOING",
      },
    });

    mockGetInternalByEvent.mockResolvedValue({
      success: true,
      data: [
        { id: "cat-1", name: "VIP A (Bulk)", price: 0, total_ticket: 20, issued_ticket: 5, is_hidden: true },
        { id: "cat-2", name: "Ekonomi (Komunitas)", price: 0, total_ticket: 50, issued_ticket: 10, is_hidden: true },
        { id: "cat-3", name: "VVIP Habis", price: 0, total_ticket: 5, issued_ticket: 5, is_hidden: true },
      ],
    });
  });

  afterEach(cleanup);

  it("renders category checkboxes and dynamically shows quantity fields when checked", async () => {
    render(<GenerateBulkTicketPage />);

    expect(await screen.findByText("VIP A (Bulk)")).toBeTruthy();
    expect(screen.getByText("Ekonomi (Komunitas)")).toBeTruthy();

    // Initially no dynamic quantity fields are visible
    expect(screen.queryByText(/Jumlah Tiket per Kategori/)).toBeNull();

    // Check VIP A (Bulk)
    const vipCheckbox = screen.getByLabelText(/VIP A \(Bulk\)/i);
    fireEvent.click(vipCheckbox);

    // Quantity field for VIP A should appear dynamically with default value 1
    expect(await screen.findByText(/Jumlah Tiket per Kategori/)).toBeTruthy();
    const vipQtyInput = screen.getByLabelText("Jumlah tiket untuk VIP A (Bulk)") as HTMLInputElement;
    expect(vipQtyInput).toBeTruthy();
    expect(vipQtyInput.value).toBe("1");
    expect(screen.getByText("Total Tiket")).toBeTruthy();

    // Check Ekonomi (Komunitas) as well
    const ekoCheckbox = screen.getByLabelText(/Ekonomi \(Komunitas\)/i);
    fireEvent.click(ekoCheckbox);

    // Now both inputs are displayed
    const ekoQtyInput = screen.getByLabelText("Jumlah tiket untuk Ekonomi (Komunitas)") as HTMLInputElement;
    expect(ekoQtyInput).toBeTruthy();
    expect(ekoQtyInput.value).toBe("1");

    // Uncheck VIP A
    fireEvent.click(vipCheckbox);
    expect(screen.queryByLabelText("Jumlah tiket untuk VIP A (Bulk)")).toBeNull();
    expect(screen.getByLabelText("Jumlah tiket untuk Ekonomi (Komunitas)")).toBeTruthy();
  });

  it("allows selecting all available categories and updates total quantity", async () => {
    render(<GenerateBulkTicketPage />);

    expect(await screen.findByText("Pilih Semua")).toBeTruthy();
    fireEvent.click(screen.getByText("Pilih Semua"));

    // Both in-stock categories (cat-1 with 15 and cat-2 with 40) are selected
    expect(screen.getByLabelText("Jumlah tiket untuk VIP A (Bulk)")).toBeTruthy();
    expect(screen.getByLabelText("Jumlah tiket untuk Ekonomi (Komunitas)")).toBeTruthy();

    // Adjust quantities
    const vipInput = screen.getByLabelText("Jumlah tiket untuk VIP A (Bulk)");
    fireEvent.change(vipInput, { target: { value: "3" } });

    const ekoInput = screen.getByLabelText("Jumlah tiket untuk Ekonomi (Komunitas)");
    fireEvent.change(ekoInput, { target: { value: "5" } });

    // Total should be 8
    expect(screen.getByText("8")).toBeTruthy();
  });

  it("submits multi-category payload to transactionApi.manualGenerateTickets", async () => {
    mockManualGenerateTickets.mockResolvedValue({
      success: true,
      data: { id: "tx-bulk-123" },
    });
    mockGetDetail.mockResolvedValue({
      success: true,
      data: {
        ticketDetails: [
          {
            category: { name: "VIP A (Bulk)" },
            issuedTickets: [{ id: "t-1", ticketEventNumber: 1 }],
          },
          {
            category: { name: "Ekonomi (Komunitas)" },
            issuedTickets: [{ id: "t-2", ticketEventNumber: 1 }],
          },
        ],
      },
    });

    render(<GenerateBulkTicketPage />);

    expect(await screen.findByText("VIP A (Bulk)")).toBeTruthy();

    // Fill recipient details
    fireEvent.change(screen.getByLabelText(/Nama Penerima/i), { target: { value: "Komunitas Barito" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "komunitas@example.com" } });
    fireEvent.change(screen.getByLabelText(/Nomor HP/i), { target: { value: "08123456789" } });

    // Select VIP A and Ekonomi
    fireEvent.click(screen.getByLabelText(/VIP A \(Bulk\)/i));
    fireEvent.click(screen.getByLabelText(/Ekonomi \(Komunitas\)/i));

    const vipInput = screen.getByLabelText("Jumlah tiket untuk VIP A (Bulk)");
    fireEvent.change(vipInput, { target: { value: "2" } });

    const ekoInput = screen.getByLabelText("Jumlah tiket untuk Ekonomi (Komunitas)");
    fireEvent.change(ekoInput, { target: { value: "4" } });

    // Click submit
    fireEvent.click(screen.getByRole("button", { name: /Generate Tiket Bulk/i }));

    await waitFor(() => {
      expect(mockManualGenerateTickets).toHaveBeenCalledWith({
        eventId: "event-1",
        customerName: "Komunitas Barito",
        customerEmail: "komunitas@example.com",
        customerPhone: "+628123456789",
        paymentMethod: "COMPLIMENTARY",
        codeType: "QR_CODE",
        tickets: [
          { categoryId: "cat-1", quantity: 2 },
          { categoryId: "cat-2", quantity: 4 },
        ],
      });
    });

    // Check result table rendered with both categories
    expect(await screen.findByText(/Tiket yang Berhasil Dibuat/i)).toBeTruthy();
    expect(screen.getAllByText("VIP A (Bulk)").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Ekonomi (Komunitas)").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: /Download Semua \(\.zip\)/i })).toBeTruthy();
  });

  it("shows inline warning and disables submit when quantity exceeds stock", async () => {
    render(<GenerateBulkTicketPage />);

    expect(await screen.findByText("VIP A (Bulk)")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/VIP A \(Bulk\)/i));

    const vipInput = screen.getByLabelText("Jumlah tiket untuk VIP A (Bulk)");
    // cat-1 has 15 available. Enter 25:
    fireEvent.change(vipInput, { target: { value: "25" } });

    expect(screen.getByText(/Jumlah melebihi stok yang tersedia \(15\)/i)).toBeTruthy();

    const submitBtn = screen.getByRole("button", { name: /Generate Tiket Bulk/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
  });
});
