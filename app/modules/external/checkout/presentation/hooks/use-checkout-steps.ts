import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import { orderApi } from "../../infrastructure/order.api";
import type { CompleteOrderResponse } from "../../infrastructure/order.api";
import { useOrderConfirmation } from "./use-order-confirmation";
import type { usePaymentSelection } from "./use-payment-selection";

import type { BuyerInfo, OrderSummary, PaymentMethod, OrderResponse, TicketHolder } from "../../domain/checkout.types";
import type { EventSummary } from "~/core/types";

const CHECKOUT_DEADLINE_STORAGE_KEY = "tiketbisa_checkout_deadline";
const CHECKOUT_STORAGE_KEYS = [
  CHECKOUT_DEADLINE_STORAGE_KEY,
  "tiketbisa_buyer_info",
  "tiketbisa_payment_selection",
  "tiketbisa_checkout_summary",
  "tiketbisa_ticket_holders",
  "tiketbisa_holders_same_as_main",
];

export function useCheckoutSteps(
  event: EventSummary,
  buyerInfo: BuyerInfo,
  summary: OrderSummary,
  validateForm: () => boolean,
  paymentMethods: PaymentMethod[],
  existingOrder: OrderResponse | null | undefined,
  paymentSelectionState: ReturnType<typeof usePaymentSelection>,
  holders: TicketHolder[] = [],
) {
  const navigate = useNavigate();
  const params = useParams();
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
  const { selection, setMethodId, setAgreedToTerms, setAgreedToPrivacy, applyPromo, removePromo } = paymentSelectionState;

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

  const activePaymentMethod = selectedPaymentMethod ?? existingOrder?.paymentMethod ?? null;
  const isManualTransferPayment = activePaymentMethod?.id === "manual" || activePaymentMethod?.id === "manual_transfer";

  const isStep2Valid = !!(selection.methodId && selection.agreedToTerms && selection.agreedToPrivacy);

  const handlePaymentMethodSelect = useCallback((methodId: string) => {
    setMethodId(methodId);
  }, [setMethodId]);

  const clearCheckoutStorage = useCallback(() => {
    CHECKOUT_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
  }, []);

  const expireCheckoutSession = useCallback((showMessage = true) => {
    clearCheckoutStorage();
    setLockId(null);
    setManualTransferProofFile(null);
    setIsManualTransferPending(false);
    if (showMessage) {
      alert("Sesi checkout kamu sudah kedaluwarsa. Silakan pilih tiket ulang.");
    }
    navigate(`/event/${params.eventId ?? event.id}`);
  }, [clearCheckoutStorage, event.id, navigate, params.eventId]);

  const setDeadlineFromRemainingSeconds = useCallback((remainingSeconds: number) => {
    if (remainingSeconds > 0) {
      sessionStorage.setItem(
        CHECKOUT_DEADLINE_STORAGE_KEY,
        String(Date.now() + remainingSeconds * 1000),
      );
    }
  }, []);

  const getActiveLockId = useCallback(() => (
    lockId || searchParams.get("lockId") || searchParams.get("orderId")
  ), [lockId, searchParams]);

  const getCheckoutLockRemainingSeconds = useCallback(async (activeLockId: string) => {
    const categoryIds = summary.items
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
  }, [event.id, summary.items]);

  const ensureCheckoutSessionActive = useCallback(async () => {
    const activeLockId = getActiveLockId();
    if (currentStep <= 1 || currentStep >= 5) {
      return true;
    }
    if (!activeLockId) {
      expireCheckoutSession(true);
      return false;
    }

    const remainingSeconds = currentStep >= 4
      ? await orderApi.getTempTransactionTtl(activeLockId)
      : await getCheckoutLockRemainingSeconds(activeLockId);

    if (remainingSeconds <= 0) {
      expireCheckoutSession(true);
      return false;
    }

    setDeadlineFromRemainingSeconds(remainingSeconds);
    return true;
  }, [
    currentStep,
    expireCheckoutSession,
    getActiveLockId,
    getCheckoutLockRemainingSeconds,
    setDeadlineFromRemainingSeconds,
  ]);

  /**
   * Phase 1: Ticket Locking (DDD - Intent Acquisition)
   * Ensures tickets are reserved before user spends too much time on the form.
   */
  const acquireInitialLock = useCallback(async () => {
    if (lockId || currentStep > 1) return;
    
    setIsActionLoading(true);
    try {
      const lock = await orderApi.acquireLock(event.id, summary);
      setLockId(lock.userId);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set("lockId", lock.userId);
        return newParams;
      }, { replace: true });
      
      // Store deadline in session for UI timer sync (epoch milliseconds)
      sessionStorage.setItem(CHECKOUT_DEADLINE_STORAGE_KEY, String(lock.expiresAt));
    } catch (error) {
      console.error("Failed to acquire initial ticket lock", error);
    } finally {
      setIsActionLoading(false);
    }
  }, [lockId, currentStep, event.id, summary, setSearchParams]);

  // Trigger lock on mount if on step 1
  useEffect(() => {
    if (currentStep === 1) {
      acquireInitialLock();
    }
  }, [currentStep, acquireInitialLock]);

  useEffect(() => {
    if (summary.items.length === 0 && currentStep <= 3) {
      sessionStorage.removeItem(CHECKOUT_DEADLINE_STORAGE_KEY);
    }
  }, [summary.items.length, currentStep]);

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

  const handleNext = useCallback(async () => {
    switch (currentStep) {
      case 1:
        setBlockingError(null);
        if (validateForm()) {
          if (summary.items.length === 0) {
            alert("Pilih tiket dulu sebelum lanjut ke pembayaran.");
            navigate(`/event/${event.id}`);
            return;
          }

          // Always (re-)acquire the lock here with the buyer's current holder data. The
          // preliminary "intent" lock made on mount (see acquireInitialLock) has no holders
          // yet - reusing that lockId as-is would carry an empty holders array all the way to
          // the final commit and fail validation there. Re-locking (even if a lockId already
          // exists) guarantees the lock Redis is holding always matches what the buyer just
          // filled in on this step.
          setIsActionLoading(true);
          try {
            const lock = await orderApi.acquireLock(event.id, summary, holders);
            setLockId(lock.userId);
            sessionStorage.setItem(CHECKOUT_DEADLINE_STORAGE_KEY, String(lock.expiresAt));
            setSearchParams({ ...Object.fromEntries(searchParams), step: "2", lockId: lock.userId });
          } catch (e: any) {
            setBlockingError(e?.message || "Maaf, tiket tidak tersedia atau gagal dikunci. Silakan coba lagi.");
            return;
          } finally {
            setIsActionLoading(false);
          }
        }
        break;
      case 2:
        if (isStep2Valid) {
          if (await ensureCheckoutSessionActive()) {
            setSearchParams({ ...Object.fromEntries(searchParams), step: "3" });
          }
        }
        break;
      case 3:
        {
          setBlockingError(null);
          const activeLockId = getActiveLockId();
          if (selectedPaymentMethod && activeLockId) {
            if (!(await ensureCheckoutSessionActive())) {
              return;
            }
            setLockId(activeLockId);
            // DDD Phase 2: Store Identity on existing Lock
            const result = await confirmOrder({
              lockId: activeLockId,
              eventId: event.id,
              buyerInfo,
              summary,
              paymentMethod: selectedPaymentMethod,
              promoCode: selection.appliedPromo?.code,
            });

            if (result) {
              setSearchParams({
                ...Object.fromEntries(searchParams),
                step: "4",
                orderId: result.orderId,
                lockId: activeLockId,
              });
            }
          } else {
            console.warn("Missing lockId or payment method for confirmation");
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
                alert("Silakan unggah bukti transfer terlebih dahulu.");
                return;
              }

              await orderApi.submitManualTransferProof(activeLockId, manualTransferProofFile);
              setCompletedOrder(null);
              setIsManualTransferPending(true);
            } else {
              const result = await orderApi.executeOrder(
                activeLockId,
                summary.totalPrice,
              );
              setCompletedOrder(result);
              setIsManualTransferPending(false);
            }

            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("step", "5");
            nextParams.set("lockId", activeLockId);
            nextParams.set("orderId", activeLockId);
            if (isManualTransferPayment) {
              nextParams.set("manualPending", "1");
            } else {
              nextParams.delete("manualPending");
            }
            setSearchParams(nextParams);
          } else {
            alert("Sesi checkout tidak ditemukan. Silakan ulangi dari halaman event.");
            navigate(`/event/${params.eventId}`);
          }
        } catch (error: any) {
          const message = error?.message || "Gagal menyelesaikan transaksi.";
          console.error("Failed to execute final order", error);

          if (message.includes("404") || message.toLowerCase().includes("expired") || message.toLowerCase().includes("not found")) {
            alert("Sesi transaksi kamu sudah tidak valid atau kedaluwarsa. Silakan checkout ulang.");
            sessionStorage.removeItem(CHECKOUT_DEADLINE_STORAGE_KEY);
            navigate(`/event/${params.eventId}`);
          } else {
            alert(message);
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
  }, [currentStep, event.id, buyerInfo, summary, validateForm, searchParams, setSearchParams, confirmOrder, navigate, selectedPaymentMethod, isStep2Valid, lockId, isManualTransferPayment, manualTransferProofFile, ensureCheckoutSessionActive, clearCheckoutStorage, params.eventId, getActiveLockId]);

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
      const result = await orderApi.executeOrder(activeLockId, summary.totalPrice);
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
  }, [currentStep, isManualTransferPayment, lockId, searchParams, summary.totalPrice, setSearchParams]);

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
    isStep2Valid,
    handlePaymentMethodSelect,
    setMethodId,
    setAgreedToTerms,
    setAgreedToPrivacy,
    applyPromo,
    removePromo,
    blockingError,
    clearBlockingError: useCallback(() => setBlockingError(null), []),
    lockId // Exposed for debugging or extended logic
  };
}
