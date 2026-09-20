export type TransactionType = "WEBSITE" | "COMMUNITY" | "COMPLIMENTARY";
export type TransactionTypeFilter = TransactionType | "all";

export const transactionTypeOptions = [
  { value: "all", label: "Semua Tipe" },
  { value: "WEBSITE", label: "Website" },
  { value: "COMPLIMENTARY", label: "Complimentary" },
  { value: "COMMUNITY", label: "Community" },
];

export function toTransactionType(filter: TransactionTypeFilter): TransactionType | undefined {
  return filter === "all" ? undefined : filter;
}

export function parseTransactionType(value: string | null): TransactionTypeFilter {
  return transactionTypeOptions.some((option) => option.value === value)
    ? value as TransactionTypeFilter
    : "all";
}
