import { Card, Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { BuyerInfo, OrderSummary, PaymentMethod } from "../../domain/checkout.types";

export interface OrderConfirmationProps {
  buyerInfo: BuyerInfo;
  summary: OrderSummary;
  paymentMethod?: PaymentMethod;
  onNext: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function OrderConfirmation({
  buyerInfo,
  summary,
  paymentMethod,
  onNext,
  onBack,
  isLoading,
}: OrderConfirmationProps) {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Main Container - Full Width */}
      <Card className="overflow-hidden bg-white border-2 border-gray-100 rounded-3xl md:rounded-[2.5rem]">
        <div className="p-5 md:p-10 space-y-8 md:space-y-12">
          {/* Section 1: Informasi Pembeli */}
          <section className="space-y-6">
            <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-3 tracking-tight">
              <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
              Informasi Pembeli
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 md:gap-y-8 p-6 md:p-8 border-2 border-gray-50 rounded-2xl md:rounded-3xl">
              <InfoItem label="Nama Lengkap" value={buyerInfo.fullName} />
              <InfoItem label="Alamat Email" value={buyerInfo.email} />
              <InfoItem label="Nomor Telepon" value={buyerInfo.phoneNumber} />
              <InfoItem label="Tipe Identitas" value={`${buyerInfo.identityType}: ${buyerInfo.identityNumber}`} />
            </div>
          </section>

          {/* Section 2: Detail Tiket & Ringkasan Biaya (Combined) */}
          <section className="space-y-6">
            <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-3 tracking-tight">
              <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
              Detail Tiket & Ringkasan Biaya
            </h3>
            <div className="border-2 border-gray-50 rounded-2xl md:rounded-3xl overflow-hidden">
              <div className="p-6 md:p-8 space-y-4 md:space-y-6 bg-white">
                {summary.items.map((item) => (
                  <div key={item.ticketId} className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-base md:text-lg font-black text-text-primary">{item.ticketName}</p>
                      <p className="text-xs md:text-sm text-text-secondary font-bold">{item.quantity}x {formatIDR(item.price)}</p>
                    </div>
                    <p className="text-base md:text-lg font-black text-text-primary">{formatIDR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-6 md:p-8 bg-gray-50/50 space-y-3 md:space-y-4 border-t border-gray-50">
                <SummaryRow label="Subtotal" value={formatIDR(summary.subtotal)} />
                {summary.tax > 0 && <SummaryRow label="Pajak" value={formatIDR(summary.tax)} />}
                {summary.serviceFee > 0 && <SummaryRow label="Biaya Layanan" value={formatIDR(summary.serviceFee)} />}
                {summary.adminFee > 0 && <SummaryRow label="Biaya Admin" value={formatIDR(summary.adminFee)} />}
                <div className="pt-6 border-t-2 border-dashed border-gray-200 mt-2 flex justify-between items-center">
                  <span className="font-black text-text-primary text-lg md:text-xl">Total Bayar</span>
                  <span className="font-black text-brand-primary text-2xl md:text-3xl">{formatIDR(summary.totalPrice)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Metode Pembayaran */}
          <section className="space-y-6">
            <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-3 tracking-tight">
              <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
              Metode Pembayaran
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 md:p-8 border-2 border-brand-primary/10 rounded-2xl md:rounded-3xl bg-brand-primary/[0.02] gap-4">
              <div className="flex items-center gap-4 md:gap-6">
                {paymentMethod?.logo && (
                  <div className="p-2 md:p-4 bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
                    <img src={paymentMethod.logo} alt={paymentMethod.name} className="h-8 md:h-10 w-auto object-contain" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-base md:text-lg font-black text-text-primary">{paymentMethod?.name || "Belum dipilih"}</p>
                  <p className="text-xs md:text-sm font-bold text-text-secondary">Metode pembayaran pilihan Anda</p>
                </div>
              </div>
              <button 
                onClick={onBack}
                className="text-sm font-black text-brand-primary hover:underline self-start sm:self-center"
              >
                Ubah Metode
              </button>
            </div>
          </section>
        </div>
      </Card>

      {/* Action Buttons - Hidden on Mobile (Handled by Sticky Bar) */}
      <div className="hidden lg:flex flex-col sm:flex-row gap-4 md:gap-6">
        <button
          onClick={onBack}
          className="flex-1 py-5 md:py-6 px-8 border-2 border-gray-200 rounded-2xl text-text-secondary font-bold text-lg md:text-xl hover:bg-gray-50 transition-all"
        >
          Kembali
        </button>
        <Button
          onClick={onNext}
          isLoading={isLoading}
          className="flex-[2] py-5 md:py-6 px-8 rounded-2xl text-lg md:text-xl font-black tracking-tight shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 hover:-translate-y-1 transition-all"
        >
          Konfirmasi & Bayar Sekarang
        </Button>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="text-base font-bold text-text-primary break-words">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <span className="text-base font-bold text-text-primary">{value}</span>
    </div>
  );
}
