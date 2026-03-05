import { useState } from "react";
import { useSearchParams } from "react-router";
import { OrderDetailsForm } from "./components/order-details-form";
import { CheckoutSidebar } from "./components/checkout-sidebar";
import type { BuyerInfo, OrderSummary } from "../domain/checkout.types";

export default function CheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStep = parseInt(searchParams.get("step") || "1", 10);

  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    fullName: "",
    email: "",
    phoneNumber: "",
    identityType: "KTP",
    identityNumber: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BuyerInfo, string>>>({});

  // Mocked Order Summary
  const mockSummary: OrderSummary = {
    subtotal: 150000,
    adminFee: 5000,
    totalPrice: 155000,
    items: [
      {
        ticketId: "t-1",
        ticketName: "Early Bird - Day 1",
        price: 75000,
        quantity: 2,
      },
    ],
  };

  const validate = (): boolean => {
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
  };

  const handleInputChange = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNext = () => {
    if (validate()) {
      setSearchParams({ step: "2" });
    }
  };

  if (currentStep !== 1) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center bg-white">
        <div className="p-8 bg-gray-50 rounded-full mb-8">
           <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Segera Hadir</h2>
        <p className="text-gray-500 font-medium mb-10 max-w-sm">Tahapan ini sedang dalam proses pengembangan oleh tim kami.</p>
        <button 
          onClick={() => setSearchParams({ step: "1" })}
          className="px-8 py-3 bg-brand-primary text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand-primary/20"
        >
          Kembali ke Detail Pesanan
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start max-w-7xl mx-auto py-4">
      {/* Left Column */}
      <div className="lg:col-span-8 space-y-8">
        <OrderDetailsForm 
          data={buyerInfo} 
          errors={errors}
          onChange={handleInputChange} 
          className="animate-in fade-in slide-in-from-bottom-8 duration-700"
        />
        
        <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-100">
          <h3 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Panduan Penting</h3>
          <ul className="space-y-4">
            {[
              "Pastikan email aktif untuk pengiriman E-Tiket.",
              "Nama harus sesuai kartu identitas (KTP/Passport).",
              "E-Tiket akan dikirim maksimal 15 menit setelah pembayaran."
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                <p className="text-sm font-bold text-gray-600 leading-relaxed">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column */}
      <aside className="lg:col-span-4 lg:sticky lg:top-28 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
        <CheckoutSidebar 
          summary={mockSummary} 
          onNext={handleNext} 
        />
        
        <div className="mt-6 flex flex-wrap justify-center gap-4 grayscale opacity-40">
           <div className="flex items-center gap-1">
             <div className="w-5 h-3 bg-gray-400 rounded-sm" />
             <div className="w-5 h-3 bg-gray-400 rounded-sm" />
             <div className="w-5 h-3 bg-gray-400 rounded-sm" />
           </div>
           <span className="text-[10px] font-bold text-gray-500">PAYMENT PARTNERS</span>
        </div>
      </aside>
    </div>
  );
}
