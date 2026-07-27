import { useState, useCallback, useEffect } from "react";
import type { BuyerInfo, TicketHolder } from "../../domain/checkout.types";

const STORAGE_KEY = "tiketbisa_buyer_info";
const HOLDERS_STORAGE_KEY = "tiketbisa_ticket_holders";
const SAME_AS_MAIN_STORAGE_KEY = "tiketbisa_holders_same_as_main";

const DEFAULT_BUYER_INFO: BuyerInfo = {
  fullName: "",
  email: "",
  phoneNumber: "",
  identityType: "KTP",
  identityNumber: "",
};

const NIK_REGEX = /^[0-9]{16}$/;

function emptyHolder(): TicketHolder {
  return { name: "", identityNumber: "" };
}

/** Resize the holders array to exactly `count` entries, preserving existing values. */
function resizeHolders(holders: TicketHolder[], count: number): TicketHolder[] {
  if (holders.length === count) return holders;
  if (holders.length > count) return holders.slice(0, count);
  return [...holders, ...Array.from({ length: count - holders.length }, emptyHolder)];
}

export interface HolderFieldErrors {
  name?: string;
  identityNumber?: string;
}

export function useCheckoutForm() {
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>(DEFAULT_BUYER_INFO);
  const [holders, setHolders] = useState<TicketHolder[]>([]);
  const [sameAsMain, setSameAsMain] = useState(false);
  const [isStorageReady, setIsStorageReady] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<keyof BuyerInfo, string>>>({});
  const [holderErrors, setHolderErrors] = useState<HolderFieldErrors[]>([]);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBuyerInfo(JSON.parse(saved));
      } catch {
        setBuyerInfo(DEFAULT_BUYER_INFO);
      }
    }

    const savedHolders = sessionStorage.getItem(HOLDERS_STORAGE_KEY);
    if (savedHolders) {
      try {
        setHolders(JSON.parse(savedHolders));
      } catch {
        setHolders([]);
      }
    }

    const savedSameAsMain = sessionStorage.getItem(SAME_AS_MAIN_STORAGE_KEY);
    if (savedSameAsMain) {
      try {
        setSameAsMain(JSON.parse(savedSameAsMain));
      } catch {
        setSameAsMain(false);
      }
    }

    setIsStorageReady(true);
  }, []);

  useEffect(() => {
    if (!isStorageReady) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buyerInfo));
  }, [buyerInfo, isStorageReady]);

  useEffect(() => {
    if (!isStorageReady) return;
    sessionStorage.setItem(HOLDERS_STORAGE_KEY, JSON.stringify(holders));
  }, [holders, isStorageReady]);

  useEffect(() => {
    if (!isStorageReady) return;
    sessionStorage.setItem(SAME_AS_MAIN_STORAGE_KEY, JSON.stringify(sameAsMain));
  }, [sameAsMain, isStorageReady]);

  /**
   * Ensure the holders array has exactly `count` entries (one per selected ticket).
   * Called whenever the total selected ticket quantity changes.
   */
  const syncHolderCount = useCallback((count: number) => {
    setHolders((prev) => resizeHolders(prev, count));
    setHolderErrors((prev) => {
      if (prev.length === count) return prev;
      if (prev.length > count) return prev.slice(0, count);
      return [...prev, ...Array.from({ length: count - prev.length }, () => ({}))];
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof BuyerInfo, string>> = {};

    if (!buyerInfo.fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi";
    } else if (buyerInfo.fullName.length < 3) {
      newErrors.fullName = "Nama minimal 3 karakter";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!buyerInfo.email.trim()) {
      newErrors.email = "Alamat email wajib diisi";
    } else if (!emailRegex.test(buyerInfo.email)) {
      newErrors.email = "Format email tidak valid";
    }

    const phoneRegex = /^[0-9]+$/;
    if (!buyerInfo.phoneNumber.trim()) {
      newErrors.phoneNumber = "Nomor telepon wajib diisi";
    } else if (!phoneRegex.test(buyerInfo.phoneNumber)) {
      newErrors.phoneNumber = "Hanya boleh angka";
    } else if (buyerInfo.phoneNumber.length < 10 || buyerInfo.phoneNumber.length > 13) {
      newErrors.phoneNumber = "Harus 10-13 digit";
    }

    if (!buyerInfo.identityNumber.trim()) {
      newErrors.identityNumber = "NIK wajib diisi";
    } else if (!NIK_REGEX.test(buyerInfo.identityNumber.trim())) {
      newErrors.identityNumber = "NIK harus 16 digit angka";
    }

    setErrors(newErrors);

    const newHolderErrors: HolderFieldErrors[] = holders.map((holder) => {
      const holderError: HolderFieldErrors = {};
      if (!holder.name.trim()) {
        holderError.name = "Nama pemegang tiket wajib diisi";
      } else if (holder.name.trim().length < 3) {
        holderError.name = "Nama minimal 3 karakter";
      }

      if (!holder.identityNumber.trim()) {
        holderError.identityNumber = "NIK wajib diisi";
      } else if (!NIK_REGEX.test(holder.identityNumber.trim())) {
        holderError.identityNumber = "NIK harus 16 digit angka";
      }

      return holderError;
    });
    setHolderErrors(newHolderErrors);

    const hasHolderErrors = newHolderErrors.some(
      (holderError) => holderError.name || holderError.identityNumber,
    );

    return Object.keys(newErrors).length === 0 && !hasHolderErrors;
  }, [buyerInfo, holders]);

  const handleInputChange = useCallback((field: keyof BuyerInfo, value: string) => {
    setBuyerInfo((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleHolderChange = useCallback((index: number, field: keyof TicketHolder, value: string) => {
    setHolders((prev) => {
      const next = [...prev];
      if (!next[index]) next[index] = emptyHolder();
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setHolderErrors((prev) => {
      if (!prev[index] || !prev[index][field]) return prev;
      const next = [...prev];
      next[index] = { ...next[index], [field]: undefined };
      return next;
    });
  }, []);

  const handleToggleSameAsMain = useCallback((checked: boolean) => {
    setSameAsMain(checked);
    if (checked) {
      setHolders((prev) =>
        prev.map(() => ({
          name: buyerInfo.fullName,
          identityNumber: buyerInfo.identityNumber,
        })),
      );
      setHolderErrors((prev) => prev.map(() => ({})));
    }
  }, [buyerInfo.fullName, buyerInfo.identityNumber]);

  // Keep holders in sync with the buyer's main data while "samakan data" is checked.
  useEffect(() => {
    if (!sameAsMain) return;
    setHolders((prev) =>
      prev.map((holder) => {
        const nextIdentity = buyerInfo.identityNumber;
        if (holder.name === buyerInfo.fullName && holder.identityNumber === nextIdentity) {
          return holder;
        }
        return { name: buyerInfo.fullName, identityNumber: nextIdentity };
      }),
    );
  }, [sameAsMain, buyerInfo.fullName, buyerInfo.identityNumber]);

  return {
    buyerInfo,
    errors,
    validate,
    handleInputChange,
    holders,
    holderErrors,
    sameAsMain,
    syncHolderCount,
    handleHolderChange,
    handleToggleSameAsMain,
  };
}
