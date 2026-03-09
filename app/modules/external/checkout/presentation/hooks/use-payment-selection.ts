import { useState } from "react";
import type { PaymentSelection } from "../../domain/checkout.types";

export function usePaymentSelection() {
  const [selection, setSelection] = useState<PaymentSelection>({
    methodId: null,
    agreedToTerms: false,
    agreedToPrivacy: false,
  });

  const setMethodId = (methodId: string) => {
    setSelection((prev) => ({ ...prev, methodId }));
  };

  const setAgreedToTerms = (agreedToTerms: boolean) => {
    setSelection((prev) => ({ ...prev, agreedToTerms }));
  };

  const setAgreedToPrivacy = (agreedToPrivacy: boolean) => {
    setSelection((prev) => ({ ...prev, agreedToPrivacy }));
  };

  return {
    selection,
    setMethodId,
    setAgreedToTerms,
    setAgreedToPrivacy,
  };
}
