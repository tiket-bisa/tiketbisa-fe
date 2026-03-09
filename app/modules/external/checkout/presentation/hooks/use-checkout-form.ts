import { useState, useCallback, useEffect } from "react";
import type { BuyerInfo } from "../../domain/checkout.types";

const STORAGE_KEY = "tiketbisa_buyer_info";

export function useCheckoutForm() {
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>(() => {
    if (typeof window === "undefined") return {
      fullName: "",
      email: "",
      phoneNumber: "",
      identityType: "KTP",
      identityNumber: "",
    };
    
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      fullName: "",
      email: "",
      phoneNumber: "",
      identityType: "KTP",
      identityNumber: "",
    };
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BuyerInfo, string>>>({});

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buyerInfo));
  }, [buyerInfo]);

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

    if (!buyerInfo.identityType) {
      newErrors.identityType = "Tipe identitas wajib dipilih";
    }

    if (!buyerInfo.identityNumber.trim()) {
      newErrors.identityNumber = "Nomor identitas wajib diisi";
    } else if (buyerInfo.identityType === "KTP" || buyerInfo.identityType === "SIM") {
      if (!phoneRegex.test(buyerInfo.identityNumber)) {
        newErrors.identityNumber = "Hanya boleh angka";
      } else if (buyerInfo.identityType === "KTP" && buyerInfo.identityNumber.length !== 16) {
        newErrors.identityNumber = "KTP harus tepat 16 digit";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [buyerInfo]);

  const handleInputChange = useCallback((field: keyof BuyerInfo, value: string) => {
    setBuyerInfo((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  return {
    buyerInfo,
    errors,
    validate,
    handleInputChange,
  };
}
