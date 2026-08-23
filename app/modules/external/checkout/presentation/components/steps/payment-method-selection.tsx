import { Card } from "~/core/design-system/components";
import type { PaymentMethod, VirtualAccountBank } from "../../../domain/checkout.types";

export interface PaymentMethodSelectionProps {
  methods: PaymentMethod[];
  virtualAccountBanks: VirtualAccountBank[];
  paymentSessionEnabled?: boolean;
  selectedMethodId: string | null;
  onSelect: (methodId: string) => void;
  selectedBankCode?: string | null;
  onSelectBank?: (bankCode: string) => void;
  className?: string;
}

export function PaymentMethodSelection({ methods, virtualAccountBanks, paymentSessionEnabled = false,
  selectedMethodId, onSelect, selectedBankCode, onSelectBank, className = "" }: PaymentMethodSelectionProps) {
  return (
    <Card className={`p-6 md:p-8 rounded-3xl border-gray-100 ${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {methods.map((method) => (
          <button key={method.id} type="button" onClick={() => onSelect(method.id)}
            className={`relative flex min-h-24 items-center rounded-2xl border-2 p-4 text-left transition-all cursor-pointer ${selectedMethodId === method.id
              ? "border-brand-primary bg-brand-primary/[0.04] ring-1 ring-brand-primary/20"
              : "border-gray-200 bg-white hover:border-gray-400"}`}>
            <span className="block text-sm font-black text-text-primary">{method.name}</span>
          </button>
        ))}
      </div>
      {!paymentSessionEnabled && selectedMethodId === "va" && (
        <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
          <p className="text-xs font-black uppercase tracking-widest text-text-tertiary">Pilih Bank</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {virtualAccountBanks.map((bank) => (
              <button key={bank.code} type="button" onClick={() => onSelectBank?.(bank.code)}
                className={`h-14 rounded-xl border-2 text-sm font-black cursor-pointer ${selectedBankCode === bank.code
                  ? "border-brand-primary text-brand-primary"
                  : "border-gray-200 text-text-primary hover:border-gray-400"}`}>
                {bank.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
