import type { Transaction } from "~/core/types";

export type TransactionStatus = Transaction["status"];

export const STATUS_MAP: Record<
  TransactionStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "default" }
> = {
  paid: { label: "Lunas", variant: "success" },
  waiting_payment: { label: "Menunggu Pembayaran", variant: "warning" },
  waiting_approval: { label: "Menunggu Approval", variant: "warning" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  refunded: { label: "Refund", variant: "default" },
  expired: { label: "Expired", variant: "destructive" },
};

export const statusFilterOptions: Array<{ value: "all" | TransactionStatus; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "paid", label: "Lunas" },
  { value: "waiting_payment", label: "Menunggu Pembayaran" },
  { value: "waiting_approval", label: "Menunggu Approval" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "expired", label: "Expired" },
];

export function mapTransactionStatusFilterToApi(statusFilter: "all" | TransactionStatus): string | undefined {
  if (statusFilter === "all") return undefined;
  // The dashboard's paid business state is COMPLETED. PAID is an intermediate gateway
  // reconciliation state and therefore must not be used for the "Lunas" list filter.
  if (statusFilter === "paid") return "COMPLETED";
  if (statusFilter === "waiting_payment") return "WAITING_PAYMENT";
  if (statusFilter === "waiting_approval") return "WAITING_APPROVAL";
  if (statusFilter === "cancelled") return "CANCELED";
  return statusFilter.toUpperCase();
}
