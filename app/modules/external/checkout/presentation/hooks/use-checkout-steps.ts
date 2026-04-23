import { useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useParams } from "react-router";
import { orderApi } from "../../infrastructure/order.api";
import type { CompleteOrderResponse } from "../../infrastructure/order.api";
import { useOrderConfirmation } from "./use-order-confirmation";
import { usePaymentSelection } from "./use-payment-selection";

import type { BuyerInfo, OrderSummary, PaymentMethod } from "../../domain/checkout.types";
import type { EventSummary } from "~/core/types";

export function useCheckoutSteps(
  event: EventSummary, 
  buyerInfo: BuyerInfo, 
  summary: OrderSummary, 
  validateForm: () => boolean,
  paymentMethods: PaymentMethod[]
) {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);
  
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompleteOrderResponse | null>(null);
  
  const { confirmOrder, isLoading: isConfirming } = useOrderConfirmation();
  const { selection, setMethodId, setAgreedToTerms, setAgreedToPrivacy } = usePaymentSelection();

  const selectedPaymentMethod = useMemo(() => 
    paymentMethods.find(m => m.id === selection.methodId),
    [paymentMethods, selection.methodId]
  );

  const isStep2Valid = !!(selection.methodId && selection.agreedToTerms && selection.agreedToPrivacy);

  const handleNext = useCallback(async () => {
    switch (currentStep) {
      case 1:
        if (validateForm()) {
          setSearchParams({ ...Object.fromEntries(searchParams), step: "2" });
        }
        break;
      case 2:
        if (isStep2Valid) {
          setSearchParams({ ...Object.fromEntries(searchParams), step: "3" });
        }
        break;
      case 3:
        if (selectedPaymentMethod) {
          const result = await confirmOrder({
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
          console.warn("No payment method selected for confirmation");
        }
        break;
      case 4:
        setIsActionLoading(true);
        try {
          const orderId = searchParams.get("orderId");
          if (orderId) {
            const result = await orderApi.completeOrder(orderId);
            setCompletedOrder(result);
            setSearchParams({ ...Object.fromEntries(searchParams), step: "5" });
          }
        } catch (error) {
          console.error("Failed to complete order", error);
        } finally {
          setIsActionLoading(false);
        }
        break;
      case 5:
        navigate("/event");
        break;
    }
  }, [currentStep, event, buyerInfo, summary, validateForm, searchParams, setSearchParams, confirmOrder, navigate, selectedPaymentMethod, isStep2Valid]);

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
    // Provide payment state to UI
    paymentSelection: selection,
    selectedPaymentMethod,
    isStep2Valid,
    setMethodId,
    setAgreedToTerms,
    setAgreedToPrivacy
  };
}
