// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "~/core/design-system/components";
import { transactionApi } from "~/core/api/services/transaction.api";
import { PaymentProofActions } from "./payment-proof-actions";

describe("PaymentProofActions", () => {
  const createObjectURL = vi.fn(() => "blob:payment-proof");
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps a base64 proof URL alive until the preview closes", async () => {
    vi.spyOn(transactionApi, "getPaymentProof").mockResolvedValue({
      success: true,
      data: {
        fileName: "proof.png",
        mimeType: "image/png",
        base64Content: "aW1hZ2U=",
      },
      error: null,
      reason: null,
      status_code: 200,
    });

    render(
      <ToastProvider>
        <PaymentProofActions transactionId="tx-1" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buka Bukti Transfer" }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Bukti transfer proof.png" }).getAttribute("src")).toBe("blob:payment-proof");
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Tutup bukti transfer" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:payment-proof");
  });
});
