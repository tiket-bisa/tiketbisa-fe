import { apiFetch } from "~/core/api";
import type { ApiResponse } from "~/core/api";
import type { PaymentMethod, PaymentSessionMode, VirtualAccountBank } from "../domain/checkout.types";

export interface PaymentConfiguration {
  virtualAccountBanks: VirtualAccountBank[];
  paymentSessionEnabled: boolean;
  paymentSessionMode: PaymentSessionMode;
  paymentMethods: PaymentMethod[];
}

const EMPTY_CONFIGURATION: PaymentConfiguration = {
  virtualAccountBanks: [],
  paymentSessionEnabled: false,
  paymentSessionMode: "PAYMENT_LINK",
  paymentMethods: [],
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "manual", name: "Manual Transfer", logo: "", category: "BANK_TRANSFER" },
  { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER", requiresBankSelection: true },
  { id: "qris", name: "QRIS", logo: "", category: "E_WALLET_QRIS" },
];

export const paymentApi = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return PAYMENT_METHODS;
  },

  async getConfiguration(): Promise<PaymentConfiguration> {
    try {
      const response = await apiFetch<ApiResponse<{ virtualAccountBanks: VirtualAccountBank[]; paymentSessionEnabled?: boolean; paymentSessionMode?: PaymentSessionMode; paymentMethods?: PaymentMethod[] }>>(
        "/transaction/payment-config",
      );
      if (!response.success || !response.data) return EMPTY_CONFIGURATION;
      return {
        virtualAccountBanks: response.data.virtualAccountBanks ?? [],
        paymentSessionEnabled: response.data.paymentSessionEnabled ?? false,
        paymentSessionMode: response.data.paymentSessionMode ?? "PAYMENT_LINK",
        paymentMethods: (response.data.paymentMethods ?? []).map((method) => ({ ...method, logo: method.logo ?? "", requiresBankSelection: false })),
      };
    } catch {
      return EMPTY_CONFIGURATION;
    }
  },
};
