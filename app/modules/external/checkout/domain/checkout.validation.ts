import type { PaymentSelection } from "./checkout.types";

export function canProceedWithPayment(selection: PaymentSelection, requiresBankSelection = selection.methodId === "va"): boolean {
  return Boolean(
    selection.methodId
    && selection.agreedToTerms
    && selection.agreedToPrivacy
    && (!requiresBankSelection || selection.bankCode),
  );
}
