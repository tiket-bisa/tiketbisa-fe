// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import type { Transaction } from "~/core/types";
import { TransactionTable } from "./transaction-table";

describe("TransactionTable", () => {
  it("shows an expired transaction as Expired instead of Menunggu", () => {
    const expiredTransaction: Transaction = {
      id: "tx-expired",
      event_id: "event-1",
      event_name: "Event",
      buyer_name: "Buyer",
      buyer_email: "buyer@example.com",
      ticket_name: "Regular",
      quantity: 1,
      total_price: 10000,
      status: "expired",
    };

    render(
      <MemoryRouter>
        <TransactionTable transactions={[expiredTransaction]} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Expired")).toBeTruthy();
    expect(screen.queryByText("Menunggu")).toBeNull();
  });

  it("distinguishes waiting statuses and shows the purchase timestamp", () => {
    const transactions: Transaction[] = [
      {
        id: "tx-payment",
        event_id: "event-1",
        event_name: "Event",
        buyer_name: "Buyer One",
        buyer_email: "one@example.com",
        ticket_name: "Regular",
        quantity: 1,
        total_price: 10000,
        status: "waiting_payment",
        created_at: "2026-08-25T05:00:00Z",
      },
      {
        id: "tx-approval",
        event_id: "event-1",
        event_name: "Event",
        buyer_name: "Buyer Two",
        buyer_email: "two@example.com",
        ticket_name: "Regular",
        quantity: 1,
        total_price: 10000,
        status: "waiting_approval",
        created_at: "2026-08-25T06:00:00Z",
      },
    ];

    render(
      <MemoryRouter>
        <TransactionTable transactions={transactions} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Menunggu Pembayaran")).toBeTruthy();
    expect(screen.getByText("Menunggu Approval")).toBeTruthy();
    expect(screen.getByText("25 Agu 2026, 12.00")).toBeTruthy();
    expect(screen.getByText("25 Agu 2026, 13.00")).toBeTruthy();
  });
});
