import type { PaymentMethod } from "../domain/checkout.types";

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: "bca", name: "BCA", logo: "/logos/bca.png", category: "BANK_TRANSFER" },
  { id: "bjb", name: "Bank BJB", logo: "/logos/bjb.png", category: "BANK_TRANSFER" },
  { id: "bni", name: "BNI", logo: "/logos/bni.png", category: "BANK_TRANSFER" },
  { id: "bri", name: "Bank BRI", logo: "/logos/bri.png", category: "BANK_TRANSFER" },
  { id: "bsi", name: "BSI", logo: "/logos/bsi.png", category: "BANK_TRANSFER" },
  { id: "sampoerna", name: "Bank Sampoerna", logo: "/logos/sampoerna.png", category: "BANK_TRANSFER" },
  { id: "niaga", name: "CIMB Niaga", logo: "/logos/niaga.png", category: "BANK_TRANSFER" },
  { id: "mandiri", name: "Mandiri", logo: "/logos/mandiri.png", category: "BANK_TRANSFER" },
  { id: "permata", name: "Permata Bank", logo: "/logos/permata.png", category: "BANK_TRANSFER" },
  { id: "ovo", name: "OVO", logo: "/logos/ovo.png", category: "E_WALLET_QRIS" },
  { id: "dana", name: "DANA", logo: "/logos/dana.png", category: "E_WALLET_QRIS" },
  { id: "qris", name: "QRIS", logo: "/logos/qris.png", category: "E_WALLET_QRIS" },
  { id: "gopay", name: "GoPay", logo: "/logos/gopay.png", category: "E_WALLET_QRIS" },
  { id: "linkaja", name: "LinkAja", logo: "/logos/linkaja.png", category: "E_WALLET_QRIS" },
  { id: "astrapay", name: "AstraPay", logo: "/logos/astrapay.png", category: "E_WALLET_QRIS" },
  { id: "shopeepay", name: "ShopeePay", logo: "/logos/shopeepay.png", category: "E_WALLET_QRIS" },
];

export const paymentApi = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_PAYMENT_METHODS;
  },
};
