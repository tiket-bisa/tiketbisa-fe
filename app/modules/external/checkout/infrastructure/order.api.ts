import type { BuyerInfo, OrderResponse, OrderSummary, PaymentMethod } from "../domain/checkout.types";

export const orderApi = {
  async createOrder(params: {
    buyerInfo: BuyerInfo;
    summary: OrderSummary;
    paymentMethod: PaymentMethod;
  }): Promise<OrderResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulate successful order creation
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 2);

    return {
      orderId: `TB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: "PENDING",
      totalAmount: params.summary.totalPrice,
      paymentMethod: params.paymentMethod,
      expiryTime: expiryDate.toISOString(),
      paymentInstructions: "Silakan selesaikan pembayaran sebelum batas waktu yang ditentukan.",
    };
  },
};
