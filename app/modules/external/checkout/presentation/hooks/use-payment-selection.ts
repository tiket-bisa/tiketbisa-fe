import { useState, useEffect } from "react";
import type { AppliedPromo, PaymentSelection } from "../../domain/checkout.types";

const STORAGE_KEY = "tiketbisa_payment_selection";
const DEFAULT_SELECTION: PaymentSelection = {
  methodId: null,
  agreedToTerms: false,
  agreedToPrivacy: false,
  appliedPromo: null,
};

export function usePaymentSelection() {
  const [selection, setSelection] = useState<PaymentSelection>(DEFAULT_SELECTION);
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelection(JSON.parse(saved));
      } catch {
        setSelection(DEFAULT_SELECTION);
      }
    }
    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
  }, [selection, isStorageReady]);

  const setMethodId = (methodId: string) => {
    setSelection((prev) => ({ ...prev, methodId }));
  };

  const setAgreedToTerms = (agreedToTerms: boolean) => {
    setSelection((prev) => ({ ...prev, agreedToTerms }));
  };

  const setAgreedToPrivacy = (agreedToPrivacy: boolean) => {
    setSelection((prev) => ({ ...prev, agreedToPrivacy }));
  };

  const applyPromo = (promo: AppliedPromo) => {
    setSelection((prev) => ({ ...prev, promoCode: promo.code, appliedPromo: promo }));
  };

  const removePromo = () => {
    setSelection((prev) => ({ ...prev, promoCode: undefined, appliedPromo: null }));
  };

  return {
    selection,
    setMethodId,
    setAgreedToTerms,
    setAgreedToPrivacy,
    applyPromo,
    removePromo,
  };
}
