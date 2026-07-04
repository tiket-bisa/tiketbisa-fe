import { OrderConfirmation as StepOrderConfirmation } from "./steps/order-confirmation";
import type { OrderConfirmationProps } from "./steps/order-confirmation";

export function OrderConfirmation(props: OrderConfirmationProps) {
  return <StepOrderConfirmation {...props} />;
}
