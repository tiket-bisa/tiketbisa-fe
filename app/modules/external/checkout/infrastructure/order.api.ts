import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";
import type { BuyerInfo, OrderResponse, OrderSummary, PaymentMethod } from "../domain/checkout.types";

interface TicketRequest {
  categoryId: string;
  quantity: number;
  price?: number;
}

interface CreateTransactionRq {
  userId?: string;
  eventId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  source: string;
  paymentMethod?: string;
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

export interface LockResponse {
  userId: string;
  eventId: string;
  tickets: TicketRequest[];
  timestamp: number;
  expiresAt: number;
}

export const orderApi = {
  /**
   * Phase 1: Lock tickets (DDD - Acquire Lock)
   * This should be called early in the checkout process
   */
  async acquireLock(eventId: string, summary: OrderSummary): Promise<LockResponse> {
    const tickets: TicketRequest[] = summary.items.map((item: any) => ({
      categoryId: item.ticketId || item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const payload: CreateTransactionRq = {
      eventId,
      source: "WEBSITE",
      isComplimentary: false,
      tickets
    };

    const response = await apiFetch<ApiResponse<LockResponse>>("/transaction", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to acquire ticket lock");
    }

    return response.data;
  },

  /**
   * Phase 2: Store temporary transaction with buyer info (DDD - Store Context)
   */
  async storeTempTransaction(
    lockId: string, 
    eventId: string, 
    buyerInfo: BuyerInfo, 
    summary: OrderSummary,
    paymentMethod: PaymentMethod
  ): Promise<void> {
    const tickets: TicketRequest[] = summary.items.map((item: any) => ({
      categoryId: item.ticketId || item.id,
      quantity: item.quantity,
      price: item.price
    }));

    let backendPaymentMethod = "MANUAL_TRANSFER";
    if (paymentMethod.category === "BANK_TRANSFER") {
      backendPaymentMethod = paymentMethod.id === "manual" ? "MANUAL_TRANSFER" : "VA";
    } else if (paymentMethod.category === "E_WALLET_QRIS") {
      backendPaymentMethod = "QRIS";
    }

    const payload: CreateTransactionRq = {
      userId: lockId,
      eventId,
      customerName: buyerInfo.fullName,
      customerEmail: buyerInfo.email,
      customerPhone: buyerInfo.phoneNumber,
      source: "WEBSITE",
      paymentMethod: backendPaymentMethod,
      isComplimentary: false,
      tickets
    };

    const response = await apiFetch<ApiResponse<string>>(`/transaction/temp/${lockId}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to store temporary transaction");
    }
  },

  /**
   * Phase 3: Finalize and execute order (DDD - Finalize Transaction)
   */
  async executeOrder(lockId: string): Promise<CompleteOrderResponse> {
    const response = await apiFetch<ApiResponse<CompleteOrderResponse>>(`/transaction/${lockId}/complete`, {
      method: "POST"
    });

    if (!response.success || !response.data) {
      throw new Error(response.message || "Failed to complete transaction");
    }

    return response.data;
  },

  /**
   * Legacy method for backward compatibility/simpler flow
   * Handles the whole flow internally
   */
  async createOrder(params: {
    eventId: string;
    buyerInfo: BuyerInfo;
    summary: OrderSummary;
    paymentMethod: PaymentMethod;
  }): Promise<OrderResponse> {
    // 1. Lock
    const lock = await this.acquireLock(params.eventId, params.summary);
    
    // 2. Store
    await this.storeTempTransaction(
      lock.userId, 
      params.eventId, 
      params.buyerInfo, 
      params.summary, 
      params.paymentMethod
    );

    const expiryDate = new Date(lock.expiresAt);

    return {
      orderId: lock.userId,
      status: "PENDING",
      totalAmount: params.summary.totalPrice,
      paymentMethod: params.paymentMethod,
      expiryTime: expiryDate.toISOString(),
      paymentInstructions: "Silakan selesaikan pembayaran sebelum batas waktu yang ditentukan.",
    };
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
