import type { Transaction } from "~/core/types";

export type TransactionStatus = Transaction["status"];

export const STATUS_MAP: Record<
  TransactionStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "default" }
> = {
  paid: { label: "Lunas", variant: "success" },
  pending: { label: "Menunggu", variant: "warning" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  refunded: { label: "Refund", variant: "default" },
};

export const statusFilterOptions: Array<{ value: "all" | TransactionStatus; label: string }> = [
  { value: "all", label: "Semua Status" },
  { value: "paid", label: "Lunas" },
  { value: "pending", label: "Menunggu" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "refunded", label: "Refund" },
];
