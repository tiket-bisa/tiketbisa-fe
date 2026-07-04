import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTicketSelection } from "./use-ticket-selection";

const tickets = [
  { id: "regular", name: "Regular", price: 50000, available: true, maxPerOrder: 4 },
  { id: "vip", name: "VIP", price: 100000, available: true, maxPerOrder: 4 },
  { id: "limited", name: "Limited", price: 75000, available: true, maxPerOrder: 2 },
];

describe("useTicketSelection", () => {
  it("caps total selected tickets at 4 across categories", () => {
    const { result } = renderHook(() => useTicketSelection(tickets));

    act(() => {
      result.current.updateQuantity("regular", 3);
    });
    act(() => {
      result.current.updateQuantity("vip", 2);
    });

    expect(result.current.quantities.regular).toBe(3);
    expect(result.current.quantities.vip).toBe(1);
    expect(result.current.totalItems).toBe(4);
  });

  it("respects per-ticket maxPerOrder when it is lower than the transaction limit", () => {
    const { result } = renderHook(() => useTicketSelection(tickets));

    act(() => {
      result.current.updateQuantity("limited", 4);
    });

    expect(result.current.quantities.limited).toBe(2);
    expect(result.current.totalItems).toBe(2);
  });
});
