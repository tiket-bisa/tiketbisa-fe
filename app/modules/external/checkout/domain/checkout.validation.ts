import type { PaymentSelection } from "./checkout.types";

export function canProceedWithPayment(selection: PaymentSelection): boolean {
  return Boolean(
    selection.methodId
    && selection.agreedToTerms
    && selection.agreedToPrivacy
    && (selection.methodId !== "va" || selection.bankCode),
  );
}
