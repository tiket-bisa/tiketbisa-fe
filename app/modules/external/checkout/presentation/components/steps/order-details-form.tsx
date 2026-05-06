import { Card } from "~/core/design-system/components";
import type { BuyerInfo } from "../../../domain/checkout.types";
import { CheckoutFormField } from "../shared/checkout-form-field";

export interface OrderDetailsFormProps {
  data: BuyerInfo;
  errors?: Partial<Record<keyof BuyerInfo, string>>;
  onChange: (field: keyof BuyerInfo, value: string) => void;
  className?: string;
}

export function OrderDetailsForm({ data, errors = {}, onChange, className = "" }: OrderDetailsFormProps) {
  return (
    <Card className={`p-8 bg-white border-gray-100 shadow-sm rounded-3xl ${className}`}>
      <div className="space-y-8">
        <FormHeader />

        <div className="grid grid-cols-1 gap-y-6 max-w-2xl">
          <CheckoutFormField
            id="fullName"
            label="Nama Lengkap"
            placeholder="Masukkan nama sesuai KTP"
            value={data.fullName}
            error={errors.fullName}
            onChange={(val) => onChange("fullName", val)}
          />

          <CheckoutFormField
            id="email"
            label="Alamat Email"
            type="email"
            placeholder="contoh@email.com"
            value={data.email}
            error={errors.email}
            onChange={(val) => onChange("email", val)}
          />

          <CheckoutFormField
            id="phoneNumber"
            label="Nomor Telepon"
            placeholder="Contoh: 081234567890"
            value={data.phoneNumber}
            error={errors.phoneNumber}
            onChange={(val) => onChange("phoneNumber", val)}
          />
        </div>

        <WarningInfo />
      </div>
    </Card>
  );
}

function FormHeader() {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-text-primary mb-2">Informasi Pembeli</h2>
      <p className="text-text-secondary font-medium">
        Data ini akan digunakan untuk pengiriman tiket ke email Anda.
      </p>
    </div>
  );
}

function WarningInfo() {
  return (
    <div className="pt-6 border-t border-gray-100">
      <div className="flex items-start gap-4 bg-warning-bg p-5 rounded-2xl border border-warning-text/20">
        <div className="p-2 bg-warning-text/10 rounded-lg shrink-0">
          <svg className="h-5 w-5 text-warning-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-warning-text mb-1">Cek Kembali Data Anda</p>
          <p className="text-xs leading-relaxed text-warning-text/80 font-medium">
            Pastikan data yang Anda masukkan sudah benar. Kesalahan pengisian email dapat mengakibatkan tiket tidak terkirim ke alamat yang seharusnya.
          </p>
        </div>
      </div>
    </div>
  );
}
