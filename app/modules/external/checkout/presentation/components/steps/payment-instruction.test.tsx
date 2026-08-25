// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "~/core/design-system/components";
import { PaymentInstruction } from "./payment-instruction";

afterEach(cleanup);

describe("PaymentInstruction hosted checkout", () => {
  it("menggunakan copy pembayaran yang netral", () => {
    render(
      <ToastProvider>
        <PaymentInstruction
          order={{
            orderId: "order-1",
            status: "PENDING",
            totalAmount: 25_000,
            paymentMethod: { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER" },
            expiryTime: "2026-08-23T18:00:00.000Z",
            paymentUrl: "https://payments.example.test/order-1",
          }}
          event={{
            id: "event-1",
            name: "Test Event",
            brand: "Test Brand",
            description: "",
            imageUrl: "",
            date: "23 Agustus 2026",
            location: "Jakarta",
            tickets: [],
          }}
          onAction={vi.fn()}
          onBack={vi.fn()}
          onExpire={vi.fn()}
        />
      </ToastProvider>,
    );

    expect(screen.getByRole("button", { name: "Lanjutkan Pembayaran" })).toBeTruthy();
    expect(screen.getAllByText(/halaman pembayaran/i)).toHaveLength(2);
    expect(screen.queryByText(/xendit/i)).toBeNull();
    expect(screen.queryByText(/channel/i)).toBeNull();
    expect(screen.queryByText(/payment gateway/i)).toBeNull();
  });

  it("renders QRIS natively when Components mode is enabled", () => {
    render(
      <ToastProvider>
        <PaymentInstruction
          order={{
            orderId: "order-2",
            status: "PENDING",
            totalAmount: 25_000,
            paymentMethod: { id: "qris", name: "QRIS", logo: "", category: "QRIS" },
            expiryTime: "2026-08-23T18:00:00.000Z",
            paymentSessionMode: "COMPONENTS",
            componentsSdkKey: "MOCK-COMPONENTS-order-2",
          }}
          event={{
            id: "event-1",
            name: "Test Event",
            brand: "Test Brand",
            description: "",
            imageUrl: "",
            date: "23 Agustus 2026",
            location: "Jakarta",
            tickets: [],
          }}
          onAction={vi.fn()}
          onBack={vi.fn()}
          onExpire={vi.fn()}
          transactionId="order-2"
        />
      </ToastProvider>,
    );

    expect(screen.getByRole("heading", { name: "Pembayaran QRIS" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tampilkan QRIS" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lanjutkan Pembayaran" })).toBeNull();
  });
});
