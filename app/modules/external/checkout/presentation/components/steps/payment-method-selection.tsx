import { useState } from "react";
import { Card } from "~/core/design-system/components";
import type { PaymentMethod, PaymentCategory, VirtualAccountBank } from "../../../domain/checkout.types";

export interface PaymentMethodSelectionProps {
  methods: PaymentMethod[];
  virtualAccountBanks: VirtualAccountBank[];
  selectedMethodId: string | null;
  onSelect: (methodId: string) => void;
  selectedBankCode?: string | null;
  onSelectBank?: (bankCode: string) => void;
  className?: string;
}

export function PaymentMethodSelection({
  methods,
  virtualAccountBanks,
  selectedMethodId,
  onSelect,
  selectedBankCode,
  onSelectBank,
  className = "",
}: PaymentMethodSelectionProps) {
  const [expandedCategory, setExpandedCategory] = useState<PaymentCategory | null>("BANK_TRANSFER");

  const bankTransferMethods = methods.filter((m) => m.category === "BANK_TRANSFER");
  const eWalletMethods = methods.filter((m) => m.category === "E_WALLET_QRIS");

  const toggleCategory = (category: PaymentCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bank Transfer Section */}
      <Card className="overflow-hidden border-gray-100 rounded-3xl shadow-sm bg-white">
        <button
          onClick={() => toggleCategory("BANK_TRANSFER")}
          className="w-full p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <svg className="h-6 w-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary">Transfer Bank</h3>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mt-0.5">Virtual Account</p>
            </div>
          </div>
          <svg 
            className={`h-6 w-6 text-text-tertiary transition-transform duration-300 ${expandedCategory === "BANK_TRANSFER" ? "rotate-180" : ""}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCategory === "BANK_TRANSFER" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="p-8 pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {bankTransferMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => onSelect(method.id)}
                className={`relative flex items-center justify-center p-6 rounded-2xl border-2 transition-all h-24 cursor-pointer ${
                  selectedMethodId === method.id
                    ? "border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20"
                    : "border-gray-200 hover:border-gray-400 bg-white"
                }`}
              >
                <span className={`text-sm font-black uppercase tracking-tighter ${selectedMethodId === method.id ? "text-brand-primary" : "text-text-primary"}`}>
                  {method.name}
                </span>
                {selectedMethodId === method.id && (
                  <div className="absolute top-2 right-2">
                     <div className="bg-brand-primary rounded-full p-1 shadow-lg shadow-brand-primary/20 border-2 border-white">
                       <svg className="h-2 w-2 text-base-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                       </svg>
                     </div>
                  </div>
                )}
              </button>
            ))}
            </div>

            {selectedMethodId === "va" && (
              <div className="px-8 pb-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">
                  Pilih Bank
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {virtualAccountBanks.map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => onSelectBank?.(bank.code)}
                      className={`relative flex items-center justify-center p-4 rounded-xl border-2 transition-all h-16 cursor-pointer ${
                        selectedBankCode === bank.code
                          ? "border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20"
                          : "border-gray-200 hover:border-gray-400 bg-white"
                      }`}
                    >
                      <span className={`text-sm font-black uppercase tracking-tighter ${selectedBankCode === bank.code ? "text-brand-primary" : "text-text-primary"}`}>
                        {bank.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
            </Card>


      {/* E-Wallet / QRIS Section */}
      <Card className="overflow-hidden border-gray-100 rounded-3xl shadow-sm bg-white">
        <button
          onClick={() => toggleCategory("E_WALLET_QRIS")}
          className="w-full p-8 flex items-center justify-between hover:bg-gray-50/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200">
              <svg className="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary">E-Wallet / QRIS</h3>
              <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest mt-0.5">Instant Payment</p>
            </div>
          </div>
          <svg 
            className={`h-6 w-6 text-text-tertiary transition-transform duration-300 ${expandedCategory === "E_WALLET_QRIS" ? "rotate-180" : ""}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedCategory === "E_WALLET_QRIS" ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
          <div className="p-8 pt-4">
            <div className="flex flex-wrap gap-3">
               {eWalletMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => onSelect(method.id)}
                    className={`relative px-6 py-3 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-widest cursor-pointer ${
                      selectedMethodId === method.id
                        ? "border-brand-primary bg-brand-primary/5 text-brand-primary ring-1 ring-brand-primary/10"
                        : "border-gray-200 bg-white text-text-secondary hover:border-gray-400"
                    }`}
                  >
                    {method.name}
                    {selectedMethodId === method.id && (
                      <div className="absolute top-1 right-1 z-10">
                        <div className="bg-brand-primary rounded-full p-0.5 shadow-md border-2 border-white">
                          <svg className="h-1.5 w-1.5 text-base-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
               ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
