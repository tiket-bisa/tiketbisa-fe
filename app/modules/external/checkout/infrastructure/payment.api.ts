import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";
import type { PaymentMethod, VirtualAccountBank } from "../domain/checkout.types";

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "manual", name: "Manual Transfer", logo: "", category: "BANK_TRANSFER" },
  { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER", requiresBankSelection: true },
  { id: "qris", name: "QRIS", logo: "", category: "E_WALLET_QRIS" },
];

export const paymentApi = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return PAYMENT_METHODS;
  },

  async getConfiguration(): Promise<{ virtualAccountBanks: VirtualAccountBank[]; paymentSessionEnabled: boolean; paymentMethods: PaymentMethod[] }> {
    try {
      const response = await apiFetch<ApiResponse<{ virtualAccountBanks: VirtualAccountBank[]; paymentSessionEnabled?: boolean; paymentMethods?: PaymentMethod[] }>>(
        "/transaction/payment-config",
      );
      if (!response.success || !response.data) return { virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] };
      return {
        virtualAccountBanks: response.data.virtualAccountBanks ?? [],
        paymentSessionEnabled: response.data.paymentSessionEnabled ?? false,
        paymentMethods: (response.data.paymentMethods ?? []).map((method) => ({ ...method, logo: method.logo ?? "", requiresBankSelection: false })),
      };
    } catch {
      return { virtualAccountBanks: [], paymentSessionEnabled: false, paymentMethods: [] };
    }
  },
};
