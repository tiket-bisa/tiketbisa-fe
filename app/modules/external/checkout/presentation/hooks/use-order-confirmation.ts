import { useState, useCallback } from "react";
import type { BuyerInfo, OrderSummary, PaymentMethod, OrderResponse } from "../../domain/checkout.types";
import { orderApi, type CheckoutTtl } from "../../infrastructure/order.api";

export interface ConfirmedOrderContext {
  order: OrderResponse;
  ttl: CheckoutTtl;
}

export function useOrderConfirmation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Phase 2: Store temporary transaction with identities
   * This is part of the granular DDD flow
   */
  const confirmOrder = useCallback(async (params: {
    lockId: string;
    eventId: string;
    buyerInfo: BuyerInfo;
    summary: OrderSummary;
    paymentMethod: PaymentMethod;
    promoCode?: string;
    bankCode?: string;
  }): Promise<ConfirmedOrderContext | null> => {
    setIsLoading(true);
    setError(null);
    try {
      // DDD Phase 2: Attach customer identity to existing lock
      const ttl = await orderApi.storeTempTransaction(
        params.lockId,
        params.eventId,
        params.buyerInfo,
        params.summary,
        params.paymentMethod,
        params.promoCode,
        params.bankCode
      );
      
      // Phase 3: Prepare the final view (Step 4)
      // Since it's stored on backend, we return the order context
      const orderResponse: OrderResponse = {
        orderId: params.lockId,
        status: "PENDING",
        totalAmount: params.summary.totalPrice,
        paymentMethod: params.paymentMethod,
        expiryTime: new Date(ttl.expiresAt).toISOString(),
        paymentInstructions: "Silakan selesaikan pembayaran sebelum batas waktu yang ditentukan.",
      };

      // Clear checkout data after successful identity storage
      sessionStorage.removeItem("tiketbisa_buyer_info");
      sessionStorage.removeItem("tiketbisa_payment_selection");
      
      return { order: orderResponse, ttl };
    } catch (err: any) {
      setError(err.message || "Gagal membuat pesanan. Silakan coba lagi.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    confirmOrder,
    isLoading,
    error,
  };
}
