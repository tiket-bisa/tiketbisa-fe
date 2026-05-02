import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";
import type { BuyerInfo, OrderResponse, OrderSummary, PaymentMethod } from "../domain/checkout.types";

interface TicketRequest {
  categoryId: string;
  quantity: number;
  price?: number;
}

interface LockTicketRq {
  eventId: string;
  tickets: TicketRequest[];
}

interface StoreTempTransactionRq {
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  source: string;
  paymentMethod: string;
  isComplimentary: boolean;
}

interface CompleteTransactionPayload {
  paymentProofBase64: string;
  paymentProofMimeType: string;
  paymentProofFileName: string;
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

async function convertFileToBase64(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Gagal membaca file bukti pembayaran"));
        return;
      }

      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Gagal membaca file bukti pembayaran"));
    reader.readAsDataURL(file);
  });
}

interface TicketIssuedFromApi {
  id: string;
  codeHash: string;
  codeType: string;
  ticketCategoryId: string;
  status: string;
}

interface TransactionStatusFromApi {
  customerName?: string;
  totalPrice?: number;
  paymentDate?: string;
  paymentMethod?: string;
  tickets?: TicketRequest[];
}

function getApiErrorMessage(response: unknown, fallback: string): string {
  const payload = response as any;
  if (payload?.error?.message) return String(payload.error.message);
  if (typeof payload?.error === "string" && payload.error) return payload.error;
  if (payload?.reason) return String(payload.reason);
  return fallback;
}

function calculateTotalFromTickets(tickets: TicketRequest[] | undefined): number {
  if (!tickets || tickets.length === 0) return 0;
  return tickets.reduce((sum, ticket) => {
    const price = Number(ticket.price || 0);
    const quantity = Number(ticket.quantity || 0);
    return sum + price * quantity;
  }, 0);
}

function mapPaymentMethod(paymentMethodRaw: string | undefined): PaymentMethod {
  const normalized = String(paymentMethodRaw || "").toUpperCase();

  switch (normalized) {
    case "VA":
      return {
        id: "va",
        name: "Virtual Account",
        logo: "",
        category: "BANK_TRANSFER",
      };
    case "MANUAL_TRANSFER":
      return {
        id: "manual_transfer",
        name: "Manual Transfer",
        logo: "",
        category: "BANK_TRANSFER",
      };
    case "QRIS":
      return {
        id: "qris",
        name: "QRIS",
        logo: "",
        category: "E_WALLET_QRIS",
      };
    case "EWALLET":
      return {
        id: "ewallet",
        name: "E-Wallet",
        logo: "",
        category: "E_WALLET_QRIS",
      };
    default:
      return {
        id: "unknown",
        name: normalized || "Payment",
        logo: "",
        category: "BANK_TRANSFER",
      };
  }
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

    const payload: LockTicketRq = {
      eventId,
      tickets
    };

    const response = await apiFetch<ApiResponse<LockResponse>>("/transaction", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!response.success || !response.data) {
      throw new Error(getApiErrorMessage(response, "Failed to acquire ticket lock"));
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
    let backendPaymentMethod = "MANUAL_TRANSFER";
    if (paymentMethod.category === "BANK_TRANSFER") {
      backendPaymentMethod = paymentMethod.id === "manual" ? "MANUAL_TRANSFER" : "VA";
    } else if (paymentMethod.category === "E_WALLET_QRIS") {
      backendPaymentMethod = "QRIS";
    }

    const payload: StoreTempTransactionRq = {
      eventId,
      customerName: buyerInfo.fullName,
      customerEmail: buyerInfo.email,
      customerPhone: buyerInfo.phoneNumber,
      source: "WEBSITE",
      paymentMethod: backendPaymentMethod,
      isComplimentary: false
    };

    const response = await apiFetch<ApiResponse<string>>(`/transaction/temp/${lockId}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!response.success) {
      throw new Error(getApiErrorMessage(response, "Failed to store temporary transaction"));
    }
  },

  /**
   * Phase 3: Finalize and execute order (DDD - Finalize Transaction)
   */
  async executeOrder(
    lockId: string,
    fallbackTotalPrice?: number,
  ): Promise<CompleteOrderResponse> {
    const transactionSnapshot = await this.getTransactionSnapshot(lockId);

    const response = await apiFetch<ApiResponse<Record<string, TicketIssuedFromApi[]>>>(`/transaction/${lockId}/complete`, {
      method: "POST"
    });

    if (!response.success || !response.data) {
      throw new Error(getApiErrorMessage(response, "Failed to complete transaction"));
    }

    const normalizedTickets = Object.values(response.data)
      .flat()
      .map((ticket) => ({
      ticketId: ticket.id,
      code: ticket.codeHash,
      codeType: ticket.codeType,
      categoryId: ticket.ticketCategoryId,
      status: ticket.status,
      }));

    const calculatedTotalPrice = Number(
      transactionSnapshot?.totalPrice ||
        calculateTotalFromTickets(transactionSnapshot?.tickets),
    );

    const totalPrice = calculatedTotalPrice > 0
      ? calculatedTotalPrice
      : Number(fallbackTotalPrice || 0);

    return {
      transactionId: lockId,
      customerName: transactionSnapshot?.customerName || "",
      totalPrice,
      paymentDate: transactionSnapshot?.paymentDate || new Date().toISOString(),
      tickets: normalizedTickets,
    };
  },

  async submitManualTransferProof(lockId: string, file: File): Promise<void> {
    const paymentProofBase64 = await convertFileToBase64(file);
    const payload: CompleteTransactionPayload = {
      paymentProofBase64,
      paymentProofMimeType: file.type || "application/octet-stream",
      paymentProofFileName: file.name,
    };

    const response = await apiFetch<ApiResponse<Record<string, TicketIssuedFromApi[]>>>(`/transaction/${lockId}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.success) {
      throw new Error(getApiErrorMessage(response, "Gagal mengunggah bukti pembayaran"));
    }
  },

  async getTransactionSnapshot(lockId: string): Promise<TransactionStatusFromApi | null> {
    try {
      const response = await apiFetch<ApiResponse<TransactionStatusFromApi>>(`/transaction/${lockId}`);
      if (!response.success || !response.data) return null;
      return response.data;
    } catch {
      return null;
    }
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
      const response = await apiFetch<ApiResponse<Record<string, unknown>>>(`/transaction/${orderId}`);

      if (!response.success || !response.data) {
        return null;
      }

      const data = response.data;
      const paymentMethod = mapPaymentMethod(data.paymentMethod as string | undefined);
      let totalAmount = Number(
        data.totalPrice || calculateTotalFromTickets(data.tickets as TicketRequest[] | undefined),
      );

      if (!(totalAmount > 0)) {
        const cachedSummaryRaw =
          typeof window !== "undefined"
            ? sessionStorage.getItem("tiketbisa_checkout_summary")
            : null;
        if (cachedSummaryRaw) {
          try {
            const cachedSummary = JSON.parse(cachedSummaryRaw) as {
              totalPrice?: number;
            };
            if (Number(cachedSummary?.totalPrice) > 0) {
              totalAmount = Number(cachedSummary.totalPrice);
            }
          } catch {
            // Keep existing fallback behavior
          }
        }
      }

      return {
        orderId: orderId,
        status: "PENDING",
        totalAmount,
        paymentMethod,
        expiryTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        paymentInstructions: paymentMethod.category === "BANK_TRANSFER"
          ? "Silakan transfer tepat sesuai nominal hingga 3 digit terakhir."
          : "Pindai kode QR menggunakan aplikasi pembayaran Anda.",
        virtualAccount:
          paymentMethod.category === "BANK_TRANSFER"
            ? "123456789012345"
            : undefined,
        qrCodeUrl:
          paymentMethod.category !== "BANK_TRANSFER"
            ? "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TIKETBISA_MOCK_QRIS"
            : undefined,
      };
    } catch (e) {
      return null;
    }
  }
};
