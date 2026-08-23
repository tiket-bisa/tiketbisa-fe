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
});
