// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCheckoutSteps } from "./use-checkout-steps";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setSearchParams: vi.fn(),
  warningToast: vi.fn(),
  errorToast: vi.fn(),
  acquireLock: vi.fn(),
  releaseCheckout: vi.fn(),
  getTicketLockTtl: vi.fn(),
  getTempTransactionTtl: vi.fn(),
  executeOrder: vi.fn(),
  recoverGatewayOrder: vi.fn(),
  submitManualTransferProof: vi.fn(),
  confirmOrder: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => ({ eventId: "event-1" }),
  useSearchParams: () => [mocks.searchParams, mocks.setSearchParams],
}));

vi.mock("~/core/design-system/components", () => ({
  useToast: () => ({ warning: mocks.warningToast, error: mocks.errorToast }),
}));

vi.mock("../../infrastructure/order.api", () => ({
  isGatewayPaymentSuccessful: vi.fn(() => false),
  orderApi: {
    acquireLock: mocks.acquireLock,
    releaseCheckout: mocks.releaseCheckout,
    getTicketLockTtl: mocks.getTicketLockTtl,
    getTempTransactionTtl: mocks.getTempTransactionTtl,
    executeOrder: mocks.executeOrder,
    recoverGatewayOrder: mocks.recoverGatewayOrder,
    submitManualTransferProof: mocks.submitManualTransferProof,
  },
}));

vi.mock("./use-order-confirmation", () => ({
  useOrderConfirmation: () => ({
    confirmOrder: mocks.confirmOrder,
    isLoading: false,
    error: null,
  }),
}));

describe("useCheckoutSteps checkout expiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.searchParams = new URLSearchParams("step=1&lockId=lock-1&t[category-1]=1");
    mocks.releaseCheckout.mockResolvedValue(undefined);
  });

  it("expires once, deduplicates TTL checks, and ignores a stale TTL response", async () => {
    let resolveTtl!: (value: number) => void;
    mocks.getTicketLockTtl.mockImplementation(
      () => new Promise<number>((resolve) => { resolveTtl = resolve; }),
    );
    sessionStorage.setItem("tiketbisa_checkout_deadline", String(Date.now() + 300_000));

    const { result } = renderHook(() => useCheckoutSteps(
      { id: "event-1", slug: "event-slug" } as any,
      {
        fullName: "Buyer",
        email: "buyer@example.com",
        phoneNumber: "081234567890",
        identityType: "KTP",
        identityNumber: "1234567890123456",
      },
      {
        subtotal: 10_000,
        serviceFeePerTicket: 0,
        serviceFee: 0,
        transactionFee: 0,
        discount: 0,
        totalPrice: 10_000,
        ticketCount: 1,
        items: [{ ticketId: "category-1", ticketName: "Regular", price: 10_000, quantity: 1 }],
      },
      () => ({ isValid: true, errorCount: 0, firstInvalidFieldId: null }),
      [],
      null,
      {
        selection: {
          methodId: null,
          agreedToTerms: false,
          agreedToPrivacy: false,
          appliedPromo: null,
          bankCode: null,
        },
        setMethodId: vi.fn(),
        setBankCode: vi.fn(),
        setAgreedToTerms: vi.fn(),
        setAgreedToPrivacy: vi.fn(),
        applyPromo: vi.fn(),
        removePromo: vi.fn(),
      } as any,
    ));

    await waitFor(() => expect(mocks.getTicketLockTtl).toHaveBeenCalledTimes(1));

    act(() => {
      window.dispatchEvent(new Event("focus"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(mocks.getTicketLockTtl).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.handleExpire();
      result.current.handleExpire();
    });

    await waitFor(() => expect(mocks.releaseCheckout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledTimes(1));
    expect(mocks.navigate).toHaveBeenCalledWith("/event/event-slug", { replace: true });

    await act(async () => resolveTtl(299));

    expect(sessionStorage.getItem("tiketbisa_checkout_deadline")).toBeNull();
    expect(result.current.checkoutDeadline).toBeNull();
    expect(mocks.acquireLock).not.toHaveBeenCalled();
    expect(mocks.warningToast).not.toHaveBeenCalled();
  });

  it("reuses stored event lockId from sessionStorage when re-entering step 1 without lockId in URL", async () => {
    mocks.searchParams = new URLSearchParams("step=1&t[category-1]=4");
    sessionStorage.setItem(
      "tiketbisa_checkout_lock",
      JSON.stringify({ eventId: "event-1", lockId: "stored-lock-1" }),
    );
    mocks.acquireLock.mockResolvedValue({ userId: "stored-lock-1", expiresAt: Date.now() + 300_000 });
    mocks.getTicketLockTtl.mockResolvedValue(295);

    renderHook(() => useCheckoutSteps(
      { id: "event-1", slug: "event-slug" } as any,
      {
        fullName: "Buyer",
        email: "buyer@example.com",
        phoneNumber: "081234567890",
        identityType: "KTP",
        identityNumber: "1234567890123456",
      },
      {
        subtotal: 40_000,
        serviceFeePerTicket: 0,
        serviceFee: 0,
        transactionFee: 0,
        discount: 0,
        totalPrice: 40_000,
        ticketCount: 4,
        items: [{ ticketId: "category-1", ticketName: "Regular", price: 10_000, quantity: 4 }],
      },
      () => ({ isValid: true, errorCount: 0, firstInvalidFieldId: null }),
      [],
      null,
      {
        selection: {
          methodId: null,
          agreedToTerms: false,
          agreedToPrivacy: false,
          appliedPromo: null,
          bankCode: null,
        },
        setMethodId: vi.fn(),
        setBankCode: vi.fn(),
        setAgreedToTerms: vi.fn(),
        setAgreedToPrivacy: vi.fn(),
        applyPromo: vi.fn(),
        removePromo: vi.fn(),
      } as any,
    ));

    await waitFor(() => expect(mocks.acquireLock).toHaveBeenCalledTimes(1));
    expect(mocks.acquireLock).toHaveBeenCalledWith(
      "event-1",
      expect.objectContaining({ ticketCount: 4 }),
      undefined,
      "stored-lock-1",
    );
  });

  it("awaits in-flight initial lock before re-locking with holders on handleNext", async () => {
    mocks.searchParams = new URLSearchParams("step=1&t[category-1]=4");
    let resolveInitialLock!: (value: { userId: string; expiresAt: number }) => void;
    mocks.acquireLock
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolveInitialLock = resolve; }),
      )
      .mockResolvedValueOnce({ userId: "lock-from-mount", expiresAt: Date.now() + 300_000 });
    mocks.getTicketLockTtl.mockResolvedValue(295);
    mocks.confirmOrder.mockResolvedValue({
      order: { orderId: "lock-from-mount" },
      ttl: {
        status: "ACTIVE",
        remainingSeconds: 900,
        expiresAt: Date.now() + 900_000,
        serverTime: Date.now(),
      },
    });

    const { result } = renderHook(() => useCheckoutSteps(
      { id: "event-1", slug: "event-slug" } as any,
      {
        fullName: "Buyer",
        email: "buyer@example.com",
        phoneNumber: "081234567890",
        identityType: "KTP",
        identityNumber: "1234567890123456",
      },
      {
        subtotal: 40_000,
        serviceFeePerTicket: 0,
        serviceFee: 0,
        transactionFee: 0,
        discount: 0,
        totalPrice: 40_000,
        ticketCount: 4,
        items: [{ ticketId: "category-1", ticketName: "Regular", price: 10_000, quantity: 4 }],
      },
      () => ({ isValid: true, errorCount: 0, firstInvalidFieldId: null }),
      [{ id: "qris", name: "QRIS", type: "EWALLET", fee: 0, isAvailable: true } as any],
      null,
      {
        selection: {
          methodId: "qris",
          agreedToTerms: true,
          agreedToPrivacy: true,
          appliedPromo: null,
          bankCode: null,
        },
        setMethodId: vi.fn(),
        setBankCode: vi.fn(),
        setAgreedToTerms: vi.fn(),
        setAgreedToPrivacy: vi.fn(),
        applyPromo: vi.fn(),
        removePromo: vi.fn(),
      } as any,
      [{ name: "Buyer", identityNumber: "1234567890123456" }],
    ));

    await waitFor(() => expect(mocks.acquireLock).toHaveBeenCalledTimes(1));

    let nextPromise!: Promise<void>;
    act(() => {
      nextPromise = result.current.handleNext();
    });

    // Second acquireLock should wait until initial lock resolves
    expect(mocks.acquireLock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveInitialLock({ userId: "lock-from-mount", expiresAt: Date.now() + 300_000 });
      await nextPromise;
    });

    expect(mocks.acquireLock).toHaveBeenCalledTimes(2);
    expect(mocks.acquireLock).toHaveBeenNthCalledWith(
      2,
      "event-1",
      expect.objectContaining({ ticketCount: 4 }),
      [{ name: "Buyer", identityNumber: "1234567890123456" }],
      "lock-from-mount",
    );
  });

  it("navigates directly to event page when handleBack is called on step 4", async () => {
    mocks.searchParams = new URLSearchParams("step=4&lockId=lock-1&orderId=lock-1&t[category-1]=4");
    mocks.getTempTransactionTtl.mockResolvedValue({
      status: "ACTIVE",
      remainingSeconds: 900,
      expiresAt: Date.now() + 900_000,
      serverTime: Date.now(),
    });
    mocks.recoverGatewayOrder.mockResolvedValue({
      id: "lock-1",
      status: "WAITING_PAYMENT",
      paymentMethod: "qris",
    });

    const { result } = renderHook(() => useCheckoutSteps(
      { id: "event-1", slug: "event-slug" } as any,
      {
        fullName: "Buyer",
        email: "buyer@example.com",
        phoneNumber: "081234567890",
        identityType: "KTP",
        identityNumber: "1234567890123456",
      },
      {
        subtotal: 40_000,
        serviceFeePerTicket: 0,
        serviceFee: 0,
        transactionFee: 0,
        discount: 0,
        totalPrice: 40_000,
        ticketCount: 4,
        items: [{ ticketId: "category-1", ticketName: "Regular", price: 10_000, quantity: 4 }],
      },
      () => ({ isValid: true, errorCount: 0, firstInvalidFieldId: null }),
      [],
      null,
      {
        selection: {
          methodId: "qris",
          agreedToTerms: true,
          agreedToPrivacy: true,
          appliedPromo: null,
          bankCode: null,
        },
        setMethodId: vi.fn(),
        setBankCode: vi.fn(),
        setAgreedToTerms: vi.fn(),
        setAgreedToPrivacy: vi.fn(),
        applyPromo: vi.fn(),
        removePromo: vi.fn(),
      } as any,
    ));

    await act(async () => {
      await result.current.handleBack();
    });

    expect(mocks.navigate).toHaveBeenCalledWith("/event/event-slug");
  });
});
