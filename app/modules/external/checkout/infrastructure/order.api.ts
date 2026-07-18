import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";
import type { BuyerInfo, OrderItem, OrderResponse, OrderSummary, PaymentMethod, TicketHolder } from "../domain/checkout.types";

interface TicketRequest {
  categoryId: string;
  quantity: number;
  price?: number;
  /** One entry per ticket in this category; length must equal `quantity`. */
  holders?: TicketHolder[];
}

interface LockTicketRq {
  eventId: string;
  tickets: TicketRequest[];
}

interface StoreTempTransactionRq {
  userId: string;
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

const MAX_PAYMENT_PROOF_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_PAYMENT_PROOF_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export function validateManualTransferProofFile(file: File): string | null {
  const mimeType = file.type.toLowerCase();
  const extensionAllowed = /\.(pdf|jpe?g|png)$/i.test(file.name);
  const hasStrictMimeType = Boolean(mimeType) && mimeType !== "application/octet-stream";
  if (hasStrictMimeType && !ALLOWED_PAYMENT_PROOF_MIME_TYPES.has(mimeType)) {
    return "Format file tidak didukung. Harap unggah file PDF, JPG, atau PNG.";
  }
  if (!hasStrictMimeType && !extensionAllowed) {
    return "Format file tidak didukung. Harap unggah file PDF, JPG, atau PNG.";
  }
  if (file.size > MAX_PAYMENT_PROOF_SIZE_BYTES) {
    return "Ukuran bukti pembayaran maksimal 10MB.";
  }
  return null;
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

interface TtlResponse {
  remainingSeconds?: number;
  remaining_seconds?: number;
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
   * This should be called early in the checkout process.
   *
   * `holders` is the flat, per-ticket list (one entry per ticket across all
   * categories, in the same order as `summary.items`) collected on the buyer
   * details step. It's optional because the very first lock (fired on mount,
   * before the buyer has filled the form) has no holder data yet.
   */
  async acquireLock(eventId: string, summary: OrderSummary, holders?: TicketHolder[]): Promise<LockResponse> {
    let holderCursor = 0;
    const tickets: TicketRequest[] = summary.items.map((item: OrderItem) => {
      const quantity = item.quantity;
      const itemHolders = holders
        ? holders.slice(holderCursor, holderCursor + quantity)
        : undefined;
      holderCursor += quantity;

      return {
        categoryId: item.ticketId,
        quantity,
        price: item.price,
        ...(itemHolders && itemHolders.length === quantity ? { holders: itemHolders } : {}),
      };
    });

    const payload: LockTicketRq = {
      eventId,
      tickets
    };

    const response = await apiFetch<ApiResponse<LockResponse>>("/transaction/lock", {
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
    paymentMethod: PaymentMethod,
    promoCode?: string
  ): Promise<void> {
    let backendPaymentMethod = "MANUAL_TRANSFER";
    if (paymentMethod.category === "BANK_TRANSFER") {
      const paymentMethodId = paymentMethod.id.toLowerCase();
      backendPaymentMethod = paymentMethodId === "manual" || paymentMethodId === "manual_transfer"
        ? "MANUAL_TRANSFER"
        : "VA";
    } else if (paymentMethod.category === "E_WALLET_QRIS") {
      backendPaymentMethod = "QRIS";
    }

    const payload: StoreTempTransactionRq = {
      userId: lockId,
      eventId,
      customerName: buyerInfo.fullName,
      customerEmail: buyerInfo.email,
      customerPhone: buyerInfo.phoneNumber,
      source: "WEBSITE",
      paymentMethod: backendPaymentMethod,
      isComplimentary: false,
      ...(promoCode ? { promoCode } : {}),
    };

    const response = await apiFetch<ApiResponse<string>>("/transaction/temp", {
      method: "POST",
      headers: {
        "x-tb-identifier": lockId,
      },
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
    const validationError = validateManualTransferProofFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

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

  async getTempTransactionTtl(lockId: string): Promise<number> {
    const response = await apiFetch<ApiResponse<TtlResponse>>(`/transaction/ttl/temp/${encodeURIComponent(lockId)}`);
    if (!response.success || !response.data) {
      return 0;
    }
    return Number(response.data.remainingSeconds ?? response.data.remaining_seconds ?? 0);
  },

  async getTicketLockTtl(eventId: string, categoryId: string, userId: string): Promise<number> {
    const response = await apiFetch<ApiResponse<TtlResponse>>(
      `/transaction/ttl/locks/${encodeURIComponent(eventId)}/${encodeURIComponent(categoryId)}/${encodeURIComponent(userId)}`,
    );
    if (!response.success || !response.data) {
      return 0;
    }
    return Number(response.data.remainingSeconds ?? response.data.remaining_seconds ?? 0);
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
