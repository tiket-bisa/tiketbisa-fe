import { Card, Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { OrderResponse } from "../../../domain/checkout.types";
import type { Event } from "../../../../event/domain/event.entity";
import { CountdownTimer } from "../shared/countdown-timer";

export interface PaymentInstructionProps {
  order: OrderResponse;
  event: Event;
  fallbackTotalAmount?: number;
  onAction: () => void;
  proofFile?: File | null;
  onProofFileChange?: (file: File | null) => void;
  onBack: () => void;
  onExpire: () => void;
  isLoading?: boolean;
}

export function PaymentInstruction({
  order,
  event,
  fallbackTotalAmount,
  onAction,
  proofFile,
  onProofFileChange,
  onBack,
  onExpire,
  isLoading,
}: PaymentInstructionProps) {
  const isBank = order.paymentMethod.category === "BANK_TRANSFER";
  const isManualTransfer = order.paymentMethod.id === "manual" || order.paymentMethod.id === "manual_transfer";
  const totalAmount =
    Number(order.totalAmount) > 0
      ? Number(order.totalAmount)
      : Number(fallbackTotalAmount || 0);
  
  const deadline = new Date(order.expiryTime).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  // --- 1. QRIS LAYOUT (Centered Style) ---
  if (!isBank) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="overflow-hidden border-gray-100 rounded-3xl shadow-sm bg-white">
          <div className="p-6 md:p-12 space-y-12">
            {/* Top Section: Timer & Deadline */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-sm">
                <CountdownTimer onExpire={onExpire} className="!shadow-none border-2 border-orange-100" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">Batas Waktu Pembayaran</p>
                <p className="text-lg font-black text-text-primary">{deadline} WIB</p>
              </div>
            </div>

            {/* QR Area */}
            <div className="flex flex-col items-center space-y-8 py-4">
              <div className="space-y-3 text-center">
                <img src="/logo/qris.png" alt="QRIS" className="h-10 mx-auto" />
                <p className="text-sm font-black text-text-primary tracking-tight">Pindai Kode QR Untuk Bayar</p>
              </div>
              
              <div className="p-6 bg-white border-4 border-gray-100 rounded-[3rem] shadow-xl relative">
                <div className="w-64 h-64 md:w-72 md:h-72 bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
                  {order.qrCodeUrl ? (
                    <img src={order.qrCodeUrl} alt="QR Code" className="w-full h-full object-cover p-2" />
                  ) : (
                    <div className="text-text-tertiary text-center p-8">
                       <svg className="w-20 h-20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                       </svg>
                       <p className="text-xs font-bold uppercase tracking-widest leading-tight">QR Code Pesanan</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-6 opacity-40 grayscale">
                <img src="/logos/gopay.png" alt="GoPay" className="h-4 w-auto" />
                <img src="/logos/ovo.png" alt="OVO" className="h-4 w-auto" />
                <img src="/logos/dana.png" alt="DANA" className="h-4 w-auto" />
                <img src="/logos/shopeepay.png" alt="ShopeePay" className="h-4 w-auto" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button onClick={onBack} className="flex-1 py-6 rounded-2xl border-2 border-gray-100 text-text-secondary font-black text-lg hover:bg-gray-50 transition-all">
                Batalkan Pesanan
              </button>
              <Button onClick={onAction} isLoading={isLoading} className="flex-[2] py-6 rounded-2xl text-xl font-black shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all">
                Bayar Sekarang
              </Button>
            </div>

            {/* Split Footer */}
            <div className="pt-12 border-t-2 border-dashed border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">Metode Pembayaran</p>
                <div className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-3xl bg-white">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                    {order.paymentMethod.logo ? (
                      <img src={order.paymentMethod.logo} alt={order.paymentMethod.name} className="h-8 w-auto object-contain" />
                    ) : (
                      <svg className="h-8 w-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-text-primary">{order.paymentMethod.name}</p>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">Total: {formatIDR(totalAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-black text-text-tertiary uppercase tracking-widest">Detail Acara</p>
                <div className="flex items-center gap-4 p-5 border-2 border-gray-100 rounded-3xl bg-white">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden">
                     <img src={event.imageUrl || "/logo/tiketbisa.png"} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-text-primary line-clamp-1 leading-tight">{event.name}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
                      <span>{event.date}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- 2. BANK TRANSFER LAYOUT (Traditional Style) ---
  const manualTransferBankInfo = {
    bankName: import.meta.env.VITE_MANUAL_TRANSFER_BANK_NAME ?? "BCA",
    accountNumber: import.meta.env.VITE_MANUAL_TRANSFER_ACCOUNT_NUMBER ?? "1234567890",
    accountHolder: import.meta.env.VITE_MANUAL_TRANSFER_ACCOUNT_HOLDER ?? "PT TIKET BISA INDONESIA",
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="overflow-hidden border-gray-100 rounded-3xl shadow-sm bg-white">
        {/* Header Status */}
        <div className="p-6 md:p-8 border-b border-gray-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="text-sm font-black text-warning-text uppercase tracking-widest">Menunggu Pembayaran</span>
          </div>
          <p className="text-sm font-bold text-text-secondary">
            Batas waktu: <span className="text-text-primary font-black">{deadline} WIB</span>
          </p>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          <section className="text-center space-y-4">
            <p className="text-sm font-medium text-text-secondary">Total Tagihan</p>
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-4xl md:text-5xl font-black text-brand-primary tracking-tighter">
                {formatIDR(totalAmount)}
              </h2>
              <button className="text-xs font-black text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Salin Nominal
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-3 tracking-tight">
              <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
              Metode Pembayaran
            </h3>
            <div className="flex items-center gap-6 p-6 border-2 border-gray-100 rounded-2xl bg-white">
              {order.paymentMethod.logo ? (
                <img src={order.paymentMethod.logo} alt={order.paymentMethod.name} className="h-8 w-auto object-contain" />
              ) : (
                <svg className="h-8 w-8 text-text-tertiary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              )}
              <div className="space-y-1">
                <p className="text-lg font-black text-text-primary">{order.paymentMethod.name}</p>
                <p className="text-sm font-medium text-text-secondary">
                  {isManualTransfer ? "Transfer ke rekening berikut lalu unggah bukti transfer." : "Transfer ke Nomor Virtual Account berikut"}
                </p>
              </div>
            </div>
          </section>

          {isManualTransfer ? (
            <section className="space-y-6">
              <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-3 tracking-tight">
                <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
                Informasi Rekening Transfer
              </h3>
              <div className="p-8 border-2 border-gray-100 rounded-3xl bg-white space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-secondary font-bold">Nama Bank</p>
                  <p className="text-xl font-black text-text-primary mt-1">{manualTransferBankInfo.bankName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-secondary font-bold">Nomor Rekening</p>
                  <p className="text-2xl font-black text-text-primary mt-1">{manualTransferBankInfo.accountNumber}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-secondary font-bold">Nama Pemilik Rekening</p>
                  <p className="text-xl font-black text-text-primary mt-1">{manualTransferBankInfo.accountHolder}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-3 tracking-tight">
                <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
                Nomor Virtual Account
              </h3>
              <div className="p-8 border-2 border-gray-100 rounded-3xl bg-white text-center space-y-4">
                <span className="text-3xl md:text-4xl font-black text-text-primary tracking-wider">
                  {order.virtualAccount}
                </span>
                <button className="block mx-auto px-6 py-2 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all">
                  Salin Nomor VA
                </button>
              </div>
            </section>
          )}

          {isManualTransfer && (
            <section className="space-y-4">
              <h3 className="text-lg md:text-xl font-black text-text-primary flex items-center gap-3 tracking-tight">
                <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
                Upload Bukti Transfer
              </h3>
              <label className="block p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-white cursor-pointer hover:border-brand-primary/40 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={(event) => onProofFileChange?.(event.target.files?.[0] ?? null)}
                />
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-text-secondary">
                    {proofFile ? "File dipilih" : "Pilih file bukti transfer (JPG/PNG/PDF)"}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {proofFile ? proofFile.name : "Klik untuk unggah file"}
                  </p>
                </div>
              </label>
            </section>
          )}

          <section className="bg-white border-2 border-gray-100 rounded-3xl p-8 space-y-4">
            <h4 className="text-sm font-black text-text-primary">Cara Melakukan Transfer:</h4>
            <ul className="space-y-3">
              {[
                 "Buka aplikasi mobile banking atau ATM.",
                 isManualTransfer ? "Transfer ke rekening tujuan sesuai informasi di atas." : "Pilih menu Transfer Virtual Account.",
                 isManualTransfer ? "Pastikan nominal sesuai total tagihan." : "Masukkan nomor Virtual Account di atas.",
                 isManualTransfer ? "Upload bukti transfer setelah pembayaran berhasil." : "Pastikan nominal sesuai dengan tagihan Anda.",
               ].map((step, i) => (
                 <li key={i} className="flex gap-3 text-sm font-medium text-text-secondary">
                   <span className="text-brand-primary font-black">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <div className="hidden lg:flex flex-col sm:flex-row gap-4 md:gap-6">
        <button onClick={onBack} className="flex-1 py-5 md:py-6 px-8 border-2 border-gray-200 rounded-2xl text-text-secondary font-bold text-lg hover:bg-gray-50 transition-all">
          Kembali
        </button>
        <Button
          onClick={onAction}
          isLoading={isLoading}
          disabled={isManualTransfer && !proofFile}
          className="flex-[2] py-5 md:py-6 px-8 rounded-2xl text-xl font-black shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all"
        >
          {isManualTransfer ? "Upload Bukti Pembayaran" : "Bayar Sekarang"}
        </Button>
      </div>
    </div>
  );
}
