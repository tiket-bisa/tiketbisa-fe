import { useCallback, useMemo, useState } from "react";
import { Button, Card } from "~/core/design-system/components";
import { usePublicRealtimeSubscription, type RealtimeMessage } from "~/core/realtime";
import type { Event } from "../../../../event/domain/event.entity";

interface ManualTransferPendingProps {
  event: Event;
  orderId?: string | null;
  onAction: () => void;
}

export function ManualTransferPending({ event, orderId, onAction }: ManualTransferPendingProps) {
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    if (message.type !== "order.updated" || !message.payload) {
      return;
    }
    const payload = message.payload as { status?: string };
    if (payload.status) {
      setLiveStatus(String(payload.status));
    }
  }, []);

  usePublicRealtimeSubscription(orderId ? [`order:${orderId}`] : [], handleRealtimeMessage);

  const statusCopy = useMemo(() => {
    const status = (liveStatus ?? "WAITING_APPROVAL").toUpperCase();
    if (status === "COMPLETED" || status === "PAID") {
      return {
        title: "Pembayaran berhasil diverifikasi",
        description: "Pembayaran kamu sudah disetujui. E-ticket akan dikirim lewat email.",
        label: "Disetujui",
        tone: "success",
      };
    }
    if (status === "CANCELED" || status === "CANCELLED" || status === "EXPIRED") {
      return {
        title: "Pembayaran tidak dapat diverifikasi",
        description: "Pembayaran kamu belum bisa kami setujui. Silakan hubungi Tiketbisa jika membutuhkan bantuan.",
        label: "Ditolak / kedaluwarsa",
        tone: "danger",
      };
    }
    return {
      title: "Pembayaran sedang diverifikasi",
      description: "Bukti transfer kamu sudah kami terima. Mohon tunggu, status pembayaran dan e-ticket akan kami kirim lewat email setelah proses verifikasi selesai.",
      label: "Menunggu approval manual transfer",
      tone: "warning",
    };
  }, [liveStatus]);

  const iconClassName = statusCopy.tone === "success"
    ? "bg-green-100 text-success-text"
    : statusCopy.tone === "danger"
      ? "bg-red-100 text-destructive-text"
      : "bg-amber-100 text-warning-text";

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="p-8 sm:p-10 rounded-3xl border-gray-100 shadow-sm bg-white">
        <div className="text-center space-y-6">
          <div className={`inline-flex h-20 w-20 items-center justify-center rounded-full ${iconClassName}`}>
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary">{statusCopy.title}</h1>
            <p className="text-sm sm:text-base text-text-secondary leading-7">
              {statusCopy.description}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left text-sm text-text-secondary space-y-2">
            <p><span className="font-semibold">Event:</span> {event.name}</p>
            {orderId && <p><span className="font-semibold">Order ID:</span> {orderId}</p>}
            <p><span className="font-semibold">Status:</span> {statusCopy.label}</p>
          </div>

          <Button onClick={onAction} className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold">
            Kembali ke Beranda
          </Button>
        </div>
      </Card>
    </div>
  );
}
