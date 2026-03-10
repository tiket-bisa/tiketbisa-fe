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

  async getOrderById(orderId: string): Promise<OrderResponse | null> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock data for existing order
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    // In a real app, we would fetch the specific order and its method
    const isBank = orderId.includes("BCA") || Math.random() > 0.5;

    return {
      orderId,
      status: "PENDING",
      totalAmount: 155000,
      paymentMethod: isBank ? {
        id: "bca",
        name: "BCA Transfer",
        logo: "/logos/bca.png",
        category: "BANK_TRANSFER"
      } : {
        id: "qris",
        name: "QRIS",
        logo: "/logos/qris.png",
        category: "E_WALLET_QRIS"
      },
      expiryTime: expiryDate.toISOString(),
      paymentInstructions: isBank 
        ? "Silakan transfer tepat sesuai nominal hingga 3 digit terakhir."
        : "Pindai kode QR menggunakan aplikasi pembayaran Anda.",
      virtualAccount: isBank ? "123456789012345" : undefined,
      qrCodeUrl: !isBank ? "/qris-placeholder.png" : undefined,
    };
  }
};
