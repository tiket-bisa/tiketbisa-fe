const transactionStatusLabels: Record<string, string> = {
  WAITING_PAYMENT: "Menunggu Pembayaran",
  WAITING_APPROVAL: "Menunggu Approval",
  PAID: "Lunas",
  COMPLETED: "Lunas",
  CANCELED: "Dibatalkan",
  CANCELLED: "Dibatalkan",
  EXPIRED: "Expired",
  REFUNDED: "Refund",
};

export function getEventTransactionStatusLabel(status?: string | null): string {
  return status ? transactionStatusLabels[status] ?? status : "-";
}
