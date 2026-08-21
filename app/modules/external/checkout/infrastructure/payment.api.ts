import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";
import type { PaymentMethod, VirtualAccountBank } from "../domain/checkout.types";

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "manual", name: "Manual Transfer", logo: "", category: "BANK_TRANSFER" },
  { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER" },
  { id: "qris", name: "QRIS", logo: "", category: "E_WALLET_QRIS" },
];

export const paymentApi = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return PAYMENT_METHODS;
  },

  async getConfiguration(): Promise<{ virtualAccountBanks: VirtualAccountBank[] }> {
    try {
      const response = await apiFetch<ApiResponse<{ virtualAccountBanks: VirtualAccountBank[] }>>(
        "/transaction/payment-config",
      );
      if (!response.success || !response.data) return { virtualAccountBanks: [] };
      return { virtualAccountBanks: response.data.virtualAccountBanks ?? [] };
    } catch {
      return { virtualAccountBanks: [] };
    }
  },
};
