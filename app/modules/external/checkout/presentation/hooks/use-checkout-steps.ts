import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import { orderApi } from "../../infrastructure/order.api";
import type { CompleteOrderResponse } from "../../infrastructure/order.api";
import { useOrderConfirmation } from "./use-order-confirmation";
import { usePaymentSelection } from "./use-payment-selection";

export function useCheckoutSteps(
  event: any, 
  buyerInfo: any, 
  summary: any, 
  validateForm: () => boolean,
  paymentMethods: any[]
) {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);
  
  // State for Backend Session Management
  const [lockId, setLockId] = useState<string | null>(searchParams.get("lockId"));
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompleteOrderResponse | null>(null);
  
  const { confirmOrder, isLoading: isConfirming } = useOrderConfirmation();
  const { selection, setMethodId, setAgreedToTerms, setAgreedToPrivacy } = usePaymentSelection();

  const selectedPaymentMethod = useMemo(() => 
    paymentMethods.find(m => m.id === selection.methodId),
    [paymentMethods, selection.methodId]
  );

  const isStep2Valid = !!(selection.methodId && selection.agreedToTerms && selection.agreedToPrivacy);

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
      
      // Store deadline in session for UI Timer sync
      sessionStorage.setItem("tiketbisa_checkout_deadline", new Date(lock.expiresAt).toISOString());
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

  const handleNext = useCallback(async () => {
    switch (currentStep) {
      case 1:
        if (validateForm()) {
          // If lock failed initially, try one last time before moving forward
          if (!lockId) {
             setIsActionLoading(true);
             try {
               const lock = await orderApi.acquireLock(event.id, summary);
               setLockId(lock.userId);
               setSearchParams({ ...Object.fromEntries(searchParams), step: "2", lockId: lock.userId });
             } catch (e) {
               alert("Maaf, tiket tidak tersedia atau gagal dikunci. Silakan coba lagi.");
               return;
             } finally {
               setIsActionLoading(false);
             }
          } else {
            setSearchParams({ ...Object.fromEntries(searchParams), step: "2" });
          }
        }
        break;
      case 2:
        if (isStep2Valid) {
          setSearchParams({ ...Object.fromEntries(searchParams), step: "3" });
        }
        break;
      case 3:
        if (selectedPaymentMethod && lockId) {
          // DDD Phase 2: Store Identity on existing Lock
          const result = await confirmOrder({
            lockId: lockId,
            eventId: event.id,
            buyerInfo,
            summary,
            paymentMethod: selectedPaymentMethod
          });
          
          if (result) {
            setSearchParams({ 
              ...Object.fromEntries(searchParams), 
              step: "4", 
              orderId: result.orderId 
            });
          }
        } else {
          console.warn("Missing lockId or payment method for confirmation");
        }
        break;
      case 4:
        setIsActionLoading(true);
        try {
          // DDD Phase 3: Finalize Transaction
          if (lockId) {
            const result = await orderApi.executeOrder(lockId);
            setCompletedOrder(result);
            setSearchParams({ ...Object.fromEntries(searchParams), step: "5" });
          }
        } catch (error) {
          console.error("Failed to execute final order", error);
        } finally {
          setIsActionLoading(false);
        }
        break;
      case 5:
        navigate("/event");
        break;
    }
  }, [currentStep, event.id, buyerInfo, summary, validateForm, searchParams, setSearchParams, confirmOrder, navigate, selectedPaymentMethod, isStep2Valid, lockId]);

  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      sessionStorage.removeItem("tiketbisa_checkout_deadline");
      sessionStorage.removeItem("tiketbisa_buyer_info");
      sessionStorage.removeItem("tiketbisa_payment_selection");
      navigate(`/event/${params.eventId}`);
    } else if (currentStep === 5) {
      navigate("/event");
    } else {
      navigate(-1);
    }
  }, [currentStep, navigate, params.eventId]);

  const handleExpire = useCallback(() => {
    sessionStorage.removeItem("tiketbisa_checkout_deadline");
    sessionStorage.removeItem("tiketbisa_buyer_info");
    sessionStorage.removeItem("tiketbisa_payment_selection");
    navigate(`/event/${params.eventId}`);
  }, [navigate, params.eventId]);

  return {
    currentStep,
    isActionLoading: isActionLoading || isConfirming,
    completedOrder,
    handleNext,
    handleBack,
    handleExpire,
    paymentSelection: selection,
    selectedPaymentMethod,
    isStep2Valid,
    setMethodId,
    setAgreedToTerms,
    setAgreedToPrivacy,
    lockId // Exposed for debugging or extended logic
  };
}
