// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TransactionTicketSummary } from "./transaction-ticket-summary";

afterEach(cleanup);

const ticketDetails = [{
  category: {
    id: "category-1",
    eventId: "event-1",
    name: "Tribun Barat A",
    price: 10000,
  },
  issuedTickets: [],
  ticketCount: 1,
  subtotalPrice: 10000,
}];

describe("TransactionTicketSummary", () => {
  it("shows the stored final total and applied promo discount", () => {
    render(
      <TransactionTicketSummary
        ticketDetails={ticketDetails}
        totalPrice={500}
        discountAmount={10000}
      />,
    );

    expect(screen.getByText("Rp 10.000")).toBeTruthy();
    expect(screen.getByText("Diskon promo")).toBeTruthy();
    expect(screen.getByText("-Rp 10.000")).toBeTruthy();
    expect(screen.getByText("Rp 500")).toBeTruthy();
  });

  it("does not render a promo row when no discount was applied", () => {
    render(
      <TransactionTicketSummary
        ticketDetails={ticketDetails}
        totalPrice={10500}
      />,
    );

    expect(screen.queryByText("Diskon promo")).toBeNull();
    expect(screen.getByText("Rp 10.500")).toBeTruthy();
  });
});
