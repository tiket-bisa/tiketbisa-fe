import { useState, useEffect } from "react";
import type { PaymentSelection } from "../../domain/checkout.types";

const STORAGE_KEY = "tiketbisa_payment_selection";

export function usePaymentSelection() {
  const [selection, setSelection] = useState<PaymentSelection>(() => {
    if (typeof window === "undefined") return {
      methodId: null,
      agreedToTerms: false,
      agreedToPrivacy: false,
    };

    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      methodId: null,
      agreedToTerms: false,
      agreedToPrivacy: false,
    };
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  }, [selection]);

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
