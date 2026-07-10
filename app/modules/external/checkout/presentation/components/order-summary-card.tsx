import { OrderSummaryCard as SharedOrderSummaryCard } from "./shared/order-summary-card";
import type { OrderSummaryCardProps } from "./shared/order-summary-card";

export function OrderSummaryCard(props: OrderSummaryCardProps) {
  return <SharedOrderSummaryCard {...props} />;
}
