import { Button, Card } from "~/core/design-system/components";
import type { Event } from "../../../../event/domain/event.entity";

interface ManualTransferPendingProps {
  event: Event;
  orderId?: string | null;
  onAction: () => void;
}

export function ManualTransferPending({ event, orderId, onAction }: ManualTransferPendingProps) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="p-8 sm:p-10 rounded-3xl border-gray-100 shadow-sm bg-white">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Pembayaran sedang diverifikasi</h1>
            <p className="text-sm sm:text-base text-gray-600 leading-7">
              Bukti transfer kamu sudah kami terima. Mohon tunggu, status pembayaran dan e-ticket akan kami kirim lewat email setelah proses verifikasi selesai.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left text-sm text-gray-700 space-y-2">
            <p><span className="font-semibold">Event:</span> {event.name}</p>
            {orderId && <p><span className="font-semibold">Order ID:</span> {orderId}</p>}
            <p><span className="font-semibold">Status:</span> Menunggu approval manual transfer</p>
          </div>

          <Button onClick={onAction} className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold">
            Kembali ke Beranda
          </Button>
        </div>
      </Card>
    </div>
  );
}
