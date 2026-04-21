import { Card, Button } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils/currency";
import type { OrderResponse } from "../../../domain/checkout.types";
import type { Event } from "../../../../event/domain/event.entity";
import { CountdownTimer } from "../shared/countdown-timer";

export interface PaymentInstructionProps {
  order: OrderResponse;
  event: Event;
  onAction: () => void;
  onBack: () => void;
  onExpire: () => void;
  isLoading?: boolean;
}

export function PaymentInstruction({ order, event, onAction, onBack, onExpire, isLoading }: PaymentInstructionProps) {
  const isBank = order.paymentMethod.category === "BANK_TRANSFER";
  
  const deadline = new Date(order.expiryTime).toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  // --- 1. QRIS LAYOUT (Centered Style) ---
  if (!isBank) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="overflow-hidden bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm">
          <div className="p-6 md:p-12 space-y-12">
            {/* Top Section: Timer & Deadline */}
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-full max-w-sm">
                <CountdownTimer onExpire={onExpire} className="!shadow-none border-2 border-orange-100" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Batas Waktu Pembayaran</p>
                <p className="text-lg font-black text-gray-900">{deadline} WIB</p>
              </div>
            </div>

            {/* QR Area */}
            <div className="flex flex-col items-center space-y-8 py-4">
              <div className="space-y-3 text-center">
                <img src="/logo/qris.png" alt="QRIS" className="h-10 mx-auto" />
                <p className="text-sm font-black text-gray-900 tracking-tight">Pindai Kode QR Untuk Bayar</p>
              </div>
              
              <div className="p-6 bg-white border-4 border-gray-100 rounded-[3rem] shadow-xl relative">
                <div className="w-64 h-64 md:w-72 md:h-72 bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden">
                  {order.qrCodeUrl ? (
                    <img src={order.qrCodeUrl} alt="QR Code" className="w-full h-full object-cover p-2" />
                  ) : (
                    <div className="text-gray-300 text-center p-8">
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
              <button onClick={onBack} className="flex-1 py-6 rounded-2xl border-2 border-gray-100 text-gray-500 font-black text-lg hover:bg-gray-50 transition-all">
                Batalkan Pesanan
              </button>
              <Button onClick={onAction} isLoading={isLoading} className="flex-[2] py-6 rounded-2xl text-xl font-black shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all">
                Bayar Sekarang
              </Button>
            </div>

            {/* Split Footer */}
            <div className="pt-12 border-t-2 border-dashed border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Metode Pembayaran</p>
                <div className="flex items-center gap-4 p-5 border-2 border-gray-50 rounded-3xl bg-gray-50/30">
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                    <img src={order.paymentMethod.logo} alt={order.paymentMethod.name} className="h-8 w-auto object-contain" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-black text-gray-900">{order.paymentMethod.name}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">Total: {formatIDR(order.totalAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Detail Acara</p>
                <div className="flex items-center gap-4 p-5 border-2 border-gray-50 rounded-3xl bg-white">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex-shrink-0 overflow-hidden">
                     <img src={event.imageUrl || "/logo/tiketbisa.png"} alt={event.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-gray-900 line-clamp-1 leading-tight">{event.name}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
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
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="overflow-hidden bg-white border-2 border-gray-100 rounded-3xl md:rounded-[2.5rem]">
        {/* Header Status */}
        <div className="p-6 md:p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <span className="text-sm font-black text-orange-600 uppercase tracking-widest">Menunggu Pembayaran</span>
          </div>
          <p className="text-sm font-bold text-gray-500">
            Batas waktu: <span className="text-gray-900 font-black">{deadline} WIB</span>
          </p>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          <section className="text-center space-y-4">
            <p className="text-sm font-medium text-gray-500">Total Tagihan</p>
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-4xl md:text-5xl font-black text-brand-primary tracking-tighter">
                {formatIDR(order.totalAmount)}
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
            <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
              <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
              Metode Pembayaran
            </h3>
            <div className="flex items-center gap-6 p-6 border-2 border-gray-50 rounded-2xl bg-white">
              <img src={order.paymentMethod.logo} alt={order.paymentMethod.name} className="h-8 w-auto object-contain" />
              <div className="space-y-1">
                <p className="text-lg font-black text-gray-900">{order.paymentMethod.name}</p>
                <p className="text-sm font-medium text-gray-500">Transfer ke Nomor Virtual Account berikut</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
              <span className="w-1.5 h-5 md:h-6 bg-brand-primary rounded-full" />
              Nomor Virtual Account
            </h3>
            <div className="p-8 border-2 border-gray-50 rounded-3xl bg-white text-center space-y-4">
              <span className="text-3xl md:text-4xl font-black text-gray-900 tracking-wider">
                {order.virtualAccount}
              </span>
              <button className="block mx-auto px-6 py-2 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all">
                Salin Nomor VA
              </button>
            </div>
          </section>

          <section className="bg-gray-50 rounded-3xl p-8 space-y-4">
            <h4 className="text-sm font-black text-gray-900">Cara Melakukan Transfer:</h4>
            <ul className="space-y-3">
              {[
                "Buka aplikasi mobile banking atau ATM.",
                "Pilih menu Transfer Virtual Account.",
                "Masukkan nomor Virtual Account di atas.",
                "Pastikan nominal sesuai dengan tagihan Anda.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm font-medium text-gray-600">
                  <span className="text-brand-primary font-black">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Card>

      <div className="hidden lg:flex flex-col sm:flex-row gap-4 md:gap-6">
        <button onClick={onBack} className="flex-1 py-5 md:py-6 px-8 border-2 border-gray-200 rounded-2xl text-gray-500 font-bold text-lg hover:bg-gray-50 transition-all">
          Kembali
        </button>
        <Button onClick={onAction} isLoading={isLoading} className="flex-[2] py-5 md:py-6 px-8 rounded-2xl text-xl font-black shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all">
          Upload Bukti Pembayaran
        </Button>
      </div>
    </div>
  );
}
