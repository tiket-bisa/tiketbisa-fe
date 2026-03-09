import { useState, useCallback } from "react";
import type { BuyerInfo, OrderSummary, PaymentMethod, OrderResponse } from "../../domain/checkout.types";
import { orderApi } from "../../infrastructure/order.api";

export function useOrderConfirmation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmOrder = useCallback(async (params: {
    buyerInfo: BuyerInfo;
    summary: OrderSummary;
    paymentMethod: PaymentMethod;
  }): Promise<OrderResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await orderApi.createOrder(params);
      
      // Clear checkout data after successful order
      sessionStorage.removeItem("tiketbisa_buyer_info");
      sessionStorage.removeItem("tiketbisa_payment_selection");
      
      return response;
    } catch (err) {
      setError("Gagal membuat pesanan. Silakan coba lagi.");
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
