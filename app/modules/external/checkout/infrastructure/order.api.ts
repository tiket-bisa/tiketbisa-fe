import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";
import type { BuyerInfo, OrderResponse, OrderSummary, PaymentMethod } from "../domain/checkout.types";

interface TicketRequest {
  categoryId: string;
  quantity: number;
  price: number;
}

interface CreateTransactionRq {
  userId?: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  source: string;
  paymentMethod: string;
  isComplimentary: boolean;
  tickets: TicketRequest[];
}

export interface TicketIssued {
  ticketId: string;
  code: string;
  codeType: string;
  categoryId: string;
  status: string;
}

export interface CompleteOrderResponse {
  transactionId: string;
  customerName: string;
  totalPrice: number;
  tickets: TicketIssued[];
  paymentDate: string;
}

export const orderApi = {
  async createOrder(params: {
    eventId: string;
    buyerInfo: BuyerInfo;
    summary: OrderSummary;
    paymentMethod: PaymentMethod;
  }): Promise<OrderResponse> {
    const tickets: TicketRequest[] = params.summary.items.map((item: any) => ({
      categoryId: item.ticketId || item.id,
      quantity: item.quantity,
      price: item.price
    }));

    let backendPaymentMethod = "MANUAL_TRANSFER";
    if (params.paymentMethod.category === "BANK_TRANSFER") {
      backendPaymentMethod = params.paymentMethod.id === "manual" ? "MANUAL_TRANSFER" : "VA";
    } else if (params.paymentMethod.category === "E_WALLET_QRIS") {
      backendPaymentMethod = "QRIS";
    }

    const payload: CreateTransactionRq = {
      eventId: params.eventId,
      customerName: params.buyerInfo.fullName,
      customerEmail: params.buyerInfo.email,
      customerPhone: params.buyerInfo.phoneNumber,
      source: "WEBSITE",
      paymentMethod: backendPaymentMethod,
      isComplimentary: false,
      tickets: tickets
    };

    try {
      const lockResponse = await apiFetch<ApiResponse<{ userId: string; expiresAt: number }>>("/transaction", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!lockResponse.success || !lockResponse.data?.userId) {
        throw new Error("Failed to acquire ticket lock");
      }

      const lockId = lockResponse.data.userId;

      await apiFetch(`/transaction/temp/${lockId}`, {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          userId: lockId
        })
      });

      const expiryDate = new Date(lockResponse.data.expiresAt || (Date.now() + 15 * 60 * 1000));

      return {
        orderId: lockId,
        status: "PENDING",
        totalAmount: params.summary.totalPrice,
        paymentMethod: params.paymentMethod,
        expiryTime: expiryDate.toISOString(),
        paymentInstructions: "Silakan selesaikan pembayaran sebelum batas waktu yang ditentukan.",
      };
    } catch (error: any) {
      throw error;
    }
  },

  async completeOrder(orderId: string): Promise<CompleteOrderResponse> {
    const response = await apiFetch<ApiResponse<CompleteOrderResponse>>(`/transaction/${orderId}/complete`, {
      method: "POST"
    });
    return response.data;
  },

  async getOrderById(orderId: string): Promise<OrderResponse | null> {
    try {
      const response = await apiFetch<ApiResponse<any>>(`/transaction/${orderId}`);

      if (!response.success || !response.data) {
        return null;
      }

      const data = response.data;

      const isBank = data.paymentMethod === "VA" || data.paymentMethod === "MANUAL_TRANSFER";

      return {
        orderId: orderId,
        status: "PENDING",
        totalAmount: data.totalPrice || 0,
        paymentMethod: isBank ? {
          id: "bca",
          name: "BCA Transfer",
          logo: "/logo/bca.png",
          category: "BANK_TRANSFER"
        } : {
          id: "qris",
          name: "QRIS",
          logo: "/logo/qris.png",
          category: "E_WALLET_QRIS"
        },
        expiryTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        paymentInstructions: isBank 
          ? "Silakan transfer tepat sesuai nominal hingga 3 digit terakhir."
          : "Pindai kode QR menggunakan aplikasi pembayaran Anda.",
        virtualAccount: isBank ? "123456789012345" : undefined,
        qrCodeUrl: !isBank ? "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TIKETBISA_MOCK_QRIS" : undefined,
      };
    } catch (e) {
      return null;
    }
  }
};
