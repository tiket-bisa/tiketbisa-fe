// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { OrderSummary } from "../../../domain/checkout.types";
import { OrderSummaryCard } from "./order-summary-card";

afterEach(cleanup);

const baseSummary: OrderSummary = {
  subtotal: 10000,
  serviceFeePerTicket: 500,
  serviceFee: 500,
  transactionFee: 315,
  discount: 0,
  totalPrice: 10815,
  ticketCount: 1,
  items: [{ ticketId: "ticket-1", ticketName: "Regular", price: 10000, quantity: 1 }],
};

describe("OrderSummaryCard", () => {
  it.each([
    "QRIS 3% dari sub total + biaya layanan",
    "Virtual Account Rp 5.000",
    "AstraPay Rp 5.000",
    "Akulaku Rp 5.000",
    "Indomaret Rp 5.000",
  ])("menyembunyikan rincian biaya untuk %s", (transactionFeeDescription) => {
    render(<OrderSummaryCard summary={{ ...baseSummary, transactionFeeDescription }} />);

    expect(screen.getByText("Biaya layanan")).toBeTruthy();
    expect(screen.getByText("Biaya transaksi")).toBeTruthy();
    expect(screen.getByText("Rp 500")).toBeTruthy();
    expect(screen.getByText("Rp 315")).toBeTruthy();
    expect(screen.queryByText("500 x 1 tiket")).toBeNull();
    expect(screen.queryByText(transactionFeeDescription)).toBeNull();
  });
});
