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

const transactionStatusVariants: Record<string, "success" | "warning" | "destructive" | "default"> = {
  WAITING_PAYMENT: "warning",
  WAITING_APPROVAL: "warning",
  PAID: "success",
  COMPLETED: "success",
  CANCELED: "destructive",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
  REFUNDED: "default",
};

export function getEventTransactionStatusVariant(status?: string | null): "success" | "warning" | "destructive" | "default" | "brand" {
  return status ? transactionStatusVariants[status] ?? "default" : "default";
}
