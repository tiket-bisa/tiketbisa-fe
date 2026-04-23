import type { PaymentCategory, PaymentMethod } from "../domain/checkout.types";

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "manual", name: "Manual Transfer", logo: "", category: "BANK_TRANSFER" },
  { id: "va", name: "Virtual Account", logo: "", category: "BANK_TRANSFER" },
  { id: "qris", name: "QRIS", logo: "", category: "E_WALLET_QRIS" },
];

export const paymentApi = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return PAYMENT_METHODS;
  },
};
