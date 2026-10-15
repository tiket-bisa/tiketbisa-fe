// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaymentMethodSelection } from "./payment-method-selection";

describe("PaymentMethodSelection", () => {
  it("menampilkan nama metode tanpa subtitle internal", () => {
    const onSelect = vi.fn();
    render(
      <PaymentMethodSelection
        methods={[
          { id: "manual", name: "Manual Transfer", logo: "", category: "BANK_TRANSFER" },
          { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER", requiresBankSelection: false },
          { id: "qris", name: "QRIS", logo: "", category: "QRIS" },
        ]}
        virtualAccountBanks={[]}
        selectedMethodId="va"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("Manual Transfer")).toBeTruthy();
    expect(screen.getByText("Virtual Account")).toBeTruthy();
    expect(screen.getByText("QRIS")).toBeTruthy();
    expect(screen.queryByText(/verifikasi manual/i)).toBeNull();
    expect(screen.queryByText(/diproses oleh xendit/i)).toBeNull();

    fireEvent.click(screen.getByText("QRIS"));
    expect(onSelect).toHaveBeenCalledWith("qris");
  });

  it("menampilkan pilihan bank ketika provider VA memerlukannya", () => {
    const onSelectBank = vi.fn();
    render(
      <PaymentMethodSelection
        methods={[{ id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER", requiresBankSelection: true }]}
        virtualAccountBanks={[{ code: "BCA", name: "BCA" }, { code: "MANDIRI", name: "Mandiri" }]}
        selectedMethodId="va"
        selectedBankCode="BCA"
        onSelect={vi.fn()}
        onSelectBank={onSelectBank}
      />,
    );

    expect(screen.getByText("Pilih Bank")).toBeTruthy();
    fireEvent.click(screen.getByText("Mandiri"));
    expect(onSelectBank).toHaveBeenCalledWith("MANDIRI");
  });
});
