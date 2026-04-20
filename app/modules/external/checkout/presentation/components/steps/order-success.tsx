import { Card, Button } from "~/core/design-system/components";
import type { CompleteOrderResponse } from "../../../infrastructure/order.api";
import type { Event } from "../../../../event/domain/event.entity";
import { CheckoutComingSoon } from "./checkout-coming-soon";
import { OrderEmailNotice } from "../shared/checkout-extras";

interface OrderSuccessProps {
  event: Event;
  order: CompleteOrderResponse | null;
  onAction: () => void;
}

export function OrderSuccess({ event, order, onAction }: OrderSuccessProps) {
  if (!order) return <CheckoutComingSoon />;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-500 font-bold">Terima kasih, pesanan Anda telah kami terima dan tiket telah diterbitkan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-gray-100 shadow-sm rounded-3xl overflow-hidden relative bg-white">
             <div className="absolute top-0 right-0 p-6 opacity-5">
               <svg className="w-32 h-32 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
               </svg>
             </div>
             
             <h3 className="text-xs font-black text-brand-primary mb-6 uppercase tracking-[0.2em]">E-Tiket Anda</h3>
             
             <div className="space-y-6">
                {order.tickets.map((ticket, index) => (
                  <div key={ticket.ticketId} className="flex flex-col md:flex-row gap-6 p-6 border-2 border-gray-50 rounded-2xl bg-gray-50/30">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 self-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.code}`} 
                        alt="QR Code" 
                        className="w-32 h-32"
                      />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ID TIKET</div>
                        <div className="font-mono text-sm font-bold text-gray-700">{ticket.ticketId}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">KATEGORI</div>
                          <div className="text-sm font-black text-gray-800">Tiket #{index + 1}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">STATUS</div>
                          <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700 uppercase">
                            {ticket.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>

             <div className="mt-8 flex flex-col sm:flex-row gap-3">
               <Button className="flex-1 rounded-2xl py-6 font-black gap-2">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                 </svg>
                 Unduh Semua Tiket
               </Button>
               <Button variant="secondary" className="flex-1 rounded-2xl py-6 font-black gap-2 border-gray-200">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                 </svg>
                 Bagikan
               </Button>
             </div>
          </Card>

          <Card className="p-8 border-gray-100 shadow-sm rounded-3xl bg-white">
             <h3 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">Informasi Event</h3>
             <div className="flex gap-6">
               <img src={event.imageUrl || "/featured-event.png"} className="w-24 h-24 rounded-2xl object-cover" alt="" />
               <div className="space-y-3">
                  <h4 className="font-black text-xl text-brand-primary leading-tight">{event.name}</h4>
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                   {event.date}
                 </div>
                 <div className="flex items-center gap-2 text-sm font-bold text-gray-500 line-clamp-1">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                   </svg>
                   {event.location}
                 </div>
               </div>
             </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-8 border-gray-100 shadow-sm rounded-3xl bg-white">
            <h3 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">Detail Transaksi</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                <div className="text-xs font-bold text-gray-500">ID Transaksi</div>
                <div className="text-sm font-mono font-bold text-gray-900">{order.transactionId.substring(0, 8)}...</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-300 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PEMBELI</div>
                    <div className="text-sm font-bold text-gray-900">{order.customerName}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-gray-300 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOTAL PEMBAYARAN</div>
                    <div className="text-lg font-black text-brand-primary">Rp {order.totalPrice.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={onAction}
                  className="w-full rounded-2xl py-6 font-black group"
                >
                  Kembali ke Beranda 
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </Card>
          
          <OrderEmailNotice />
        </div>
      </div>
    </div>
  );
}
