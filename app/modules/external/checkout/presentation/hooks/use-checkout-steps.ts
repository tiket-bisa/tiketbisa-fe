import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import { useToast } from "~/core/design-system/components";
import { orderApi, isGatewayPaymentSuccessful } from "../../infrastructure/order.api";
import type { CheckoutTtl, CompleteOrderResponse } from "../../infrastructure/order.api";
import { useOrderConfirmation } from "./use-order-confirmation";
import type { usePaymentSelection } from "./use-payment-selection";
import { buildPaymentOrderSummary } from "../../domain/checkout.pricing";
import { MAX_TICKETS_PER_TRANSACTION } from "~/shared/constants/transaction";

import type { BuyerInfo, OrderSummary, PaymentMethod, OrderResponse, TicketHolder } from "../../domain/checkout.types";
import type { EventSummary } from "~/core/types";

const CHECKOUT_DEADLINE_STORAGE_KEY = "tiketbisa_checkout_deadline";
/** Persists the issued-ticket success payload so a reload on step 5 can restore OrderSuccess. */
const CHECKOUT_COMPLETED_ORDER_STORAGE_KEY = "tiketbisa_completed_order";
const CHECKOUT_STORAGE_KEYS = [
  CHECKOUT_DEADLINE_STORAGE_KEY,
  CHECKOUT_COMPLETED_ORDER_STORAGE_KEY,
  "tiketbisa_buyer_info",
  "tiketbisa_payment_selection",
  "tiketbisa_checkout_summary",
  "tiketbisa_ticket_holders",
  "tiketbisa_holders_same_as_main",
];

export function useCheckoutSteps(
  event: EventSummary,
  buyerInfo: BuyerInfo,
  baseSummary: OrderSummary,
  validateForm: () => boolean,
  paymentMethods: PaymentMethod[],
  existingOrder: OrderResponse | null | undefined,
  paymentSelectionState: ReturnType<typeof usePaymentSelection>,
  holders: TicketHolder[] = [],
) {
  const navigate = useNavigate();
  const params = useParams();
  const { warning: warningToast, error: errorToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);

  // State for Backend Session Management
  const [lockId, setLockId] = useState<string | null>(searchParams.get("lockId"));
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompleteOrderResponse | null>(null);
  const [manualTransferProofFile, setManualTransferProofFile] = useState<File | null>(null);
  const [isManualTransferPending, setIsManualTransferPending] = useState(searchParams.get("manualPending") === "1");
  /** Blocking error surfaced prominently (e.g. domicile/NIK rejection from the backend). */
  const [blockingError, setBlockingError] = useState<string | null>(null);

  const { confirmOrder, isLoading: isConfirming, error: confirmOrderError } = useOrderConfirmation();
  const { selection, setMethodId, setBankCode, setAgreedToTerms, setAgreedToPrivacy, applyPromo, removePromo } = paymentSelectionState;

  // Surface a rejection from confirmOrder (e.g. domicile/NIK validation) as the blocking error.
  useEffect(() => {
    if (confirmOrderError) {
      setBlockingError(confirmOrderError);
    }
  }, [confirmOrderError]);

  const selectedPaymentMethod = useMemo(() => 
    paymentMethods.find(m => m.id === selection.methodId),
    [paymentMethods, selection.methodId]
  );

  const paymentSummary = useMemo(
    () => buildPaymentOrderSummary(baseSummary, selectedPaymentMethod ?? existingOrder?.paymentMethod ?? null),
    [baseSummary, existingOrder?.paymentMethod, selectedPaymentMethod],
  );

  const activePaymentMethod = selectedPaymentMethod ?? existingOrder?.paymentMethod ?? null;
  const isManualTransferPayment = activePaymentMethod?.id === "manual" || activePaymentMethod?.id === "manual_transfer";

  /** Payment method chosen + both consents checked — required before submitting the combined data+payment page. */
  const canProceedToPayment = !!(
    selection.methodId
    && selection.agreedToTerms
    && selection.agreedToPrivacy
    && (selection.methodId !== "va" || !!selection.bankCode)
  );
  const exceedsTicketLimit = baseSummary.ticketCount > MAX_TICKETS_PER_TRANSACTION;

  const handlePaymentMethodSelect = useCallback((methodId: string) => {
    setMethodId(methodId);
  }, [setMethodId]);

  const clearCheckoutStorage = useCallback(() => {
    CHECKOUT_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
  }, []);

  const redirectForTicketLimit = useCallback(() => {
    clearCheckoutStorage();
    warningToast(`Maksimum ${MAX_TICKETS_PER_TRANSACTION} tiket per transaksi.`);
    navigate(`/event/${params.eventId ?? event.id}`);
  }, [clearCheckoutStorage, event.id, navigate, params.eventId, warningToast]);

  const expireCheckoutSession = useCallback((showMessage = true) => {
    clearCheckoutStorage();
    setLockId(null);
    setManualTransferProofFile(null);
    setIsManualTransferPending(false);
    if (showMessage) {
      warningToast("Sesi checkout kamu sudah kedaluwarsa. Silakan pilih tiket ulang.");
    }
    navigate(`/event/${params.eventId ?? event.id}`);
  }, [clearCheckoutStorage, event.id, navigate, params.eventId, warningToast]);

  const setDeadlineFromTtl = useCallback((ttl: CheckoutTtl) => {
    if (ttl.status === "ACTIVE" && ttl.remainingSeconds > 0) {
      const backendDeadline = ttl.expiresAt > 0
        ? ttl.expiresAt
        : Date.now() + ttl.remainingSeconds * 1000;
      const storedDeadline = Number(sessionStorage.getItem(CHECKOUT_DEADLINE_STORAGE_KEY));
      const deadline = Number.isFinite(storedDeadline) && storedDeadline > Date.now()
        ? Math.min(storedDeadline, backendDeadline)
        : backendDeadline;
      sessionStorage.setItem(
        CHECKOUT_DEADLINE_STORAGE_KEY,
        String(deadline),
      );
      return true;
    }
    sessionStorage.removeItem(CHECKOUT_DEADLINE_STORAGE_KEY);
    return false;
  }, []);

  const getActiveLockId = useCallback(() => (
    lockId || searchParams.get("lockId") || searchParams.get("orderId")
  ), [lockId, searchParams]);

  const getCheckoutLockRemainingSeconds = useCallback(async (activeLockId: string) => {
    const categoryIds = baseSummary.items
      .map((item: any) => String(item.ticketId || item.id || ""))
      .filter(Boolean);

    if (categoryIds.length === 0) {
      return 0;
    }

    const ttls = await Promise.all(
      categoryIds.map((categoryId) =>
        orderApi.getTicketLockTtl(event.id, categoryId, activeLockId)
      ),
    );

    return Math.min(...ttls);
  }, [event.id, baseSummary.items]);

  const ensureCheckoutSessionActive = useCallback(async () => {
    const activeLockId = getActiveLockId();
    if (currentStep <= 1 || currentStep >= 5) {
      return true;
    }
    if (!activeLockId) {
      expireCheckoutSession(true);
      return false;
    }

    const ttl = currentStep >= 4
      ? await orderApi.getTempTransactionTtl(activeLockId)
      : null;
    const remainingSeconds = ttl?.remainingSeconds
      ?? await getCheckoutLockRemainingSeconds(activeLockId);

    if (remainingSeconds <= 0 || (ttl && ttl.status !== "ACTIVE")) {
      expireCheckoutSession(true);
      return false;
    }

    if (ttl) {
      setDeadlineFromTtl(ttl);
    }
    return true;
  }, [
    currentStep,
    expireCheckoutSession,
    getActiveLockId,
    getCheckoutLockRemainingSeconds,
    setDeadlineFromTtl,
  ]);

  /**
   * Phase 1: Ticket Locking (DDD - Intent Acquisition)
   * Ensures tickets are reserved before user spends too much time on the form. Deliberately
   * silent — no visible countdown yet, so filling in buyer data doesn't feel rushed. The
   * timer only starts once the buyer submits the combined data+payment page (see handleNext
   * case 1), by which point they've committed to a payment method.
   */
  const acquireInitialLock = useCallback(async () => {
    if (lockId || currentStep > 1) return;
    if (exceedsTicketLimit) {
      redirectForTicketLimit();
      return;
    }

    setIsActionLoading(true);
    try {
      const lock = await orderApi.acquireLock(event.id, baseSummary);
      setLockId(lock.userId);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set("lockId", lock.userId);
        return newParams;
      }, { replace: true });
    } catch (error) {
      console.error("Failed to acquire initial ticket lock", error);
    } finally {
      setIsActionLoading(false);
    }
  }, [lockId, currentStep, event.id, baseSummary, setSearchParams, exceedsTicketLimit, redirectForTicketLimit]);

  // Trigger lock on mount if on step 1
  useEffect(() => {
    if (currentStep === 1) {
      acquireInitialLock();
    }
  }, [currentStep, acquireInitialLock]);

  useEffect(() => {
    if (baseSummary.items.length === 0 && currentStep <= 3) {
      sessionStorage.removeItem(CHECKOUT_DEADLINE_STORAGE_KEY);
    }
  }, [baseSummary.items.length, currentStep]);

  useEffect(() => {
    if (currentStep >= 2 && currentStep <= 4 && exceedsTicketLimit) {
      redirectForTicketLimit();
    }
  }, [currentStep, exceedsTicketLimit, redirectForTicketLimit]);

  useEffect(() => {
    let cancelled = false;

    const validateSession = async () => {
      if (currentStep <= 1 || currentStep >= 5) {
        return;
      }
      try {
        const active = await ensureCheckoutSessionActive();
        if (!active || cancelled) {
          return;
        }
      } catch (error) {
        console.warn("Failed validating checkout session TTL", error);
      }
    };

    void validateSession();

    return () => {
      cancelled = true;
    };
  }, [currentStep, ensureCheckoutSessionActive]);

  useEffect(() => {
    if (currentStep !== 4) return;
    const resync = () => {
      if (document.visibilityState === "visible") {
        void ensureCheckoutSessionActive();
      }
    };
    window.addEventListener("focus", resync);
    document.addEventListener("visibilitychange", resync);
    return () => {
      window.removeEventListener("focus", resync);
      document.removeEventListener("visibilitychange", resync);
    };
  }, [currentStep, ensureCheckoutSessionActive]);

  // Persist the completed order while on the success step so a browser reload can restore
  // it. In-memory React state is wiped on reload, and without this OrderSuccess would fall
  // back to the "Segera Hadir" (CheckoutComingSoon) placeholder even though the purchase
  // completed successfully.
  useEffect(() => {
    if (currentStep === 5 && completedOrder) {
      try {
        sessionStorage.setItem(
          CHECKOUT_COMPLETED_ORDER_STORAGE_KEY,
          JSON.stringify(completedOrder),
        );
      } catch {
        // Ignore storage write failures (quota / serialization).
      }
    }
  }, [currentStep, completedOrder]);

  // Restore the completed order after a reload lands directly on the success step. Guarded
  // by the transaction id so a stale cache from a previous purchase is never shown, and
  // skipped for manual transfer (which renders ManualTransferPending, not OrderSuccess).
  useEffect(() => {
    if (currentStep !== 5 || isManualTransferPending || completedOrder) return;
    try {
      const raw = sessionStorage.getItem(CHECKOUT_COMPLETED_ORDER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CompleteOrderResponse;
      const orderId = searchParams.get("orderId") ?? searchParams.get("lockId");
      if (parsed && (!orderId || parsed.transactionId === orderId)) {
        setCompletedOrder(parsed);
      }
    } catch {
      // Ignore malformed cache.
    }
  }, [currentStep, isManualTransferPending, completedOrder, searchParams]);

  // Gateway payments (QRIS/VA) need an invoice created before there's anything to show, but
  // the buyer previously had to click "Bayar Sekarang" first just to *generate* the QR —
  // confusing, since that label reads as "I've already paid". Auto-create it once on arrival
  // at the payment step instead; the button remains available afterward as a no-op-safe
  // "check status now" fallback since /complete is idempotent server-side once an invoice exists.
  const gatewayInvoiceRequestedRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentStep !== 4 || isManualTransferPayment) return;
    if (existingOrder?.qrPayload || existingOrder?.virtualAccount) return;

    const activeLockId = getActiveLockId();
    if (!activeLockId || gatewayInvoiceRequestedRef.current === activeLockId) return;
    gatewayInvoiceRequestedRef.current = activeLockId;

    setIsActionLoading(true);
    (async () => {
      try {
        if (!(await ensureCheckoutSessionActive())) return;
        const result = await orderApi.executeOrder(activeLockId, paymentSummary.totalPrice);
        setCompletedOrder(result);
        setIsManualTransferPending(false);

        if (isGatewayPaymentSuccessful(result)) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.set("step", "5");
          nextParams.set("lockId", activeLockId);
          nextParams.set("orderId", activeLockId);
          nextParams.delete("manualPending");
          setSearchParams(nextParams);
        }
      } catch (error) {
        // Leave the placeholder QR/VA state up; the "Bayar Sekarang" button remains as a retry.
        console.error("Failed to auto-create gateway invoice", error);
      } finally {
        setIsActionLoading(false);
      }
    })();
  }, [
    currentStep,
    isManualTransferPayment,
    existingOrder?.qrPayload,
    existingOrder?.virtualAccount,
    getActiveLockId,
    ensureCheckoutSessionActive,
    paymentSummary.totalPrice,
    searchParams,
    setSearchParams,
  ]);

  const handleNext = useCallback(async () => {
    switch (currentStep) {
      case 1: {
        // Combined step: buyer data + payment method + consent, all on one page (no separate
        // confirmation screen). Submitting re-locks with holder data, attaches identity +
        // payment method to that lock, and only THEN starts the visible countdown — up to
        // this point the buyer could still be filling in fields without a clock pressuring them.
        setBlockingError(null);
        if (!validateForm()) break;

        if (baseSummary.items.length === 0) {
          warningToast("Pilih tiket dulu sebelum lanjut ke pembayaran.");
          navigate(`/event/${event.id}`);
          break;
        }
        if (exceedsTicketLimit) {
          redirectForTicketLimit();
          break;
        }
        if (!canProceedToPayment || !selectedPaymentMethod) {
          setBlockingError("Pilih metode pembayaran dan setujui syarat & ketentuan terlebih dahulu.");
          break;
        }

        setIsActionLoading(true);
        try {
          // Always (re-)acquire the lock here with the buyer's current holder data. The
          // preliminary "intent" lock made on mount (see acquireInitialLock) has no holders
          // yet - reusing that lockId as-is would carry an empty holders array all the way to
          // the final commit and fail validation there. Re-locking (even if a lockId already
          // exists) guarantees the lock Redis is holding always matches what the buyer just
          // filled in on this step.
          const lock = await orderApi.acquireLock(event.id, baseSummary, holders, lockId ?? undefined);
          setLockId(lock.userId);

          const result = await confirmOrder({
            lockId: lock.userId,
            eventId: event.id,
            buyerInfo,
            summary: paymentSummary,
            paymentMethod: selectedPaymentMethod,
            promoCode: selection.appliedPromo?.code,
            bankCode: selection.bankCode ?? undefined,
          });

          if (result) {
            if (!setDeadlineFromTtl(result.ttl)) {
              expireCheckoutSession(true);
              break;
            }
            setSearchParams({
              ...Object.fromEntries(searchParams),
              step: "4",
              orderId: result.order.orderId,
              lockId: lock.userId,
            });
          }
        } catch (e: any) {
          setBlockingError(e?.message || "Maaf, tiket tidak tersedia atau gagal dikunci. Silakan coba lagi.");
        } finally {
          setIsActionLoading(false);
        }
        break;
      }
      case 4:
        setIsActionLoading(true);
        try {
          // DDD Phase 3: Finalize Transaction
          const activeLockId = lockId || searchParams.get("lockId") || searchParams.get("orderId");
          if (activeLockId) {
            if (!(await ensureCheckoutSessionActive())) {
              return;
            }
            if (isManualTransferPayment) {
              if (!manualTransferProofFile) {
                warningToast("Silakan unggah bukti transfer terlebih dahulu.");
                return;
              }

              // Manual transfer: proof uploaded, now awaiting admin approval. Advance to
              // the pending screen (ManualTransferPending) — NOT the success screen.
              await orderApi.submitManualTransferProof(activeLockId, manualTransferProofFile);
              setCompletedOrder(null);
              setIsManualTransferPending(true);

              const nextParams = new URLSearchParams(searchParams);
              nextParams.set("step", "5");
              nextParams.set("lockId", activeLockId);
              nextParams.set("orderId", activeLockId);
              nextParams.set("manualPending", "1");
              setSearchParams(nextParams);
            } else {
              // Gateway (QRIS/VA): `/complete` only creates the Xendit invoice and leaves the
              // transaction WAITING_PAYMENT (tickets WAITING_APPROVAL). The buyer still has to
              // pay via Xendit, so we must NOT jump to OrderSuccess here. Surface the fresh
              // QR/VA payload and stay on the payment step; handlePaymentConfirmed advances to
              // success once the status poll/webhook reports the payment SUCCESSFUL.
              const result = await orderApi.executeOrder(
                activeLockId,
                paymentSummary.totalPrice,
              );
              setCompletedOrder(result);
              setIsManualTransferPending(false);

              if (isGatewayPaymentSuccessful(result)) {
                // Edge case: the gateway already reports success (e.g. re-click after paying,
                // or an instantly-settled bill) — go straight to the success screen.
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set("step", "5");
                nextParams.set("lockId", activeLockId);
                nextParams.set("orderId", activeLockId);
                nextParams.delete("manualPending");
                setSearchParams(nextParams);
              }
              // Otherwise stay on step 4 (PaymentInstruction) showing the QR/VA and the
              // "Menunggu pembayaran..." state until the payment is confirmed.
            }
          } else {
            errorToast("Sesi checkout tidak ditemukan. Silakan ulangi dari halaman event.");
            navigate(`/event/${params.eventId}`);
          }
        } catch (error: any) {
          const message = error?.message || "Gagal menyelesaikan transaksi.";
          console.error("Failed to execute final order", error);

          if (message.includes("404") || message.toLowerCase().includes("expired") || message.toLowerCase().includes("not found")) {
            errorToast("Sesi transaksi kamu sudah tidak valid atau kedaluwarsa. Silakan checkout ulang.");
            sessionStorage.removeItem(CHECKOUT_DEADLINE_STORAGE_KEY);
            navigate(`/event/${params.eventId}`);
          } else {
            // Hard validation failure (e.g. KTP domicile block): surface it inline instead of a
            // toast — the buyer stays on the payment step and can fix their data.
            setBlockingError(message);
          }
        } finally {
          setIsActionLoading(false);
        }
        break;
      case 5:
        clearCheckoutStorage();
        navigate("/event");
        break;
    }
  }, [currentStep, event.id, buyerInfo, baseSummary, paymentSummary, validateForm, searchParams, setSearchParams, confirmOrder, navigate, selectedPaymentMethod, canProceedToPayment, holders, lockId, isManualTransferPayment, manualTransferProofFile, ensureCheckoutSessionActive, clearCheckoutStorage, params.eventId, exceedsTicketLimit, redirectForTicketLimit, setDeadlineFromTtl, expireCheckoutSession, selection.appliedPromo?.code, selection.bankCode, warningToast, errorToast]);

  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      clearCheckoutStorage();
      navigate(`/event/${params.eventId}`);
    } else if (currentStep === 5) {
      clearCheckoutStorage();
      navigate("/event");
    } else {
      navigate(-1);
    }
  }, [clearCheckoutStorage, currentStep, navigate, params.eventId]);

  const handleExpire = useCallback(() => {
    expireCheckoutSession(false);
  }, [expireCheckoutSession]);

  /**
   * Called when the gateway (FLIP) reports the VA/QRIS payment as completed —
   * either via realtime push or the status polling fallback on step 4.
   * Mirrors the manual "Bayar Sekarang" completion path in `handleNext` (case 4),
   * but is triggered automatically instead of by a user click.
   */
  const handlePaymentConfirmed = useCallback(async () => {
    if (currentStep !== 4 || isManualTransferPayment) return;

    const activeLockId = lockId || searchParams.get("lockId") || searchParams.get("orderId");
    if (!activeLockId) return;

    setIsActionLoading(true);
    try {
      const result = await orderApi.executeOrder(activeLockId, paymentSummary.totalPrice);
      setCompletedOrder(result);
      setIsManualTransferPending(false);

      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("step", "5");
      nextParams.set("lockId", activeLockId);
      nextParams.set("orderId", activeLockId);
      nextParams.delete("manualPending");
      setSearchParams(nextParams);
    } catch (error) {
      // The payment already succeeded at the gateway; a transient error finalizing
      // locally shouldn't alarm the buyer. The regular poll/realtime loop or the
      // manual "Bayar Sekarang" button remains available as a fallback.
      console.error("Failed to auto-finalize completed payment", error);
    } finally {
      setIsActionLoading(false);
    }
  }, [currentStep, isManualTransferPayment, lockId, searchParams, paymentSummary.totalPrice, setSearchParams]);

  return {
    currentStep,
    isActionLoading: isActionLoading || isConfirming,
    completedOrder,
    isManualTransferPending,
    manualTransferProofFile,
    setManualTransferProofFile,
    handleNext,
    handleBack,
    handleExpire,
    handlePaymentConfirmed,
    paymentSelection: selection,
    selectedPaymentMethod,
    canProceedToPayment,
    handlePaymentMethodSelect,
    setMethodId,
    setBankCode,
    setAgreedToTerms,
    setAgreedToPrivacy,
    applyPromo,
    removePromo,
    blockingError,
    clearBlockingError: useCallback(() => setBlockingError(null), []),
    lockId // Exposed for debugging or extended logic
  };
}
