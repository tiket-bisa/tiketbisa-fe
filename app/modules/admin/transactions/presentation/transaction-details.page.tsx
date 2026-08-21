import { useCallback, useState } from "react";
import { useNavigate, useParams, Link, useSearchParams } from "react-router";
import { Badge, Button, Card, useToast } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { useApiQuery } from "~/core/api";
import { transactionApi } from "~/core/api/services/transaction.api";
import { useRealtimeSubscription, type RealtimeMessage } from "~/core/realtime";
import { TicketDeliveryActions } from "~/modules/internal/ticket-delivery/presentation/ticket-delivery-actions";
import { PaymentProofActions } from "~/modules/internal/common/presentation/payment-proof-actions";

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" }> = {
  WAITING_PAYMENT: { label: "Menunggu Pembayaran", variant: "warning" },
  WAITING_APPROVAL: { label: "Menunggu Approval", variant: "warning" },
  PAID: { label: "Lunas", variant: "success" },
  COMPLETED: { label: "Selesai", variant: "success" },
  CANCELED: { label: "Dibatalkan", variant: "destructive" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "destructive" },
  PAID_RECONCILIATION_REQUIRED: { label: "Perlu Rekonsiliasi", variant: "destructive" },
};

export default function AdminTransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const { error: errorToast } = useToast();
  const rawReturnTo = searchParams.get("returnTo");
  const returnTo = rawReturnTo?.startsWith("/internal-tb/admin")
    ? rawReturnTo
    : "/internal-tb/admin";

  const { data: detail, loading, refetch } = useApiQuery(
    async () => {
      if (!id) return null;
      const response = await transactionApi.getDetail(id);
      if (!response.success || !response.data) return null;
      return response.data;
    },
    [id],
  );

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    if (message.type === "transaction.updated") {
      void refetch();
    }
  }, [refetch]);

  useRealtimeSubscription(id ? [`transaction:${id}`] : [], handleRealtimeMessage);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link to={returnTo} className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Kembali ke Dashboard
        </Link>
        <div className="text-center py-16">
          <p className="text-text-tertiary">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (!detail || !detail.transaction) {
    return (
      <div className="space-y-4">
        <Link to={returnTo} className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Kembali ke Dashboard
        </Link>
        <div className="text-center py-16">
          <p className="text-text-tertiary text-lg">Transaksi tidak ditemukan</p>
          <p className="text-text-tertiary text-sm mt-2">ID: {id}</p>
        </div>
      </div>
    );
  }

  const tx = detail.transaction;
  const backendStatus = tx.status ?? "WAITING_PAYMENT";
  const status = STATUS_MAP[backendStatus] ?? { label: backendStatus, variant: "default" as const };
  const isManualPendingApproval = tx.paymentMethod === "MANUAL_TRANSFER" && backendStatus === "WAITING_APPROVAL";
  const ticketCount = detail.ticketDetails.reduce((sum, item) => sum + (item.ticketCount ?? 0), 0);

  const handleReview = async (action: "APPROVE" | "REJECT") => {
    if (!id) return;
    setIsReviewLoading(true);
    try {
      const response = await transactionApi.reviewManualTransfer(id, { action });
      if (!response.success) {
        throw new Error(response.error ?? "Gagal memproses approval");
      }
      navigate(returnTo, { replace: true });
    } catch (error) {
      errorToast(error instanceof Error ? error.message : "Gagal memproses approval");
    } finally {
      setIsReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to={returnTo} className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Kembali ke Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Detail Transaksi</h1>
          <p className="text-text-tertiary text-sm font-mono mt-1">{tx.id}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      {isManualPendingApproval && (
        <Card padding="md" className="border border-warning/40 bg-warning/5">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-sm text-text-primary font-medium">
              Transaksi manual transfer ini menunggu keputusan approval.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleReview("REJECT")}
                isLoading={isReviewLoading}
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => handleReview("APPROVE")}
                isLoading={isReviewLoading}
              >
                Approve
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">person</span>
            Pembeli
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Nama</dt>
              <dd className="text-text-primary mt-0.5">{tx.customerName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-text-primary mt-0.5">{tx.customerEmail ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Telepon</dt>
              <dd className="text-text-primary mt-0.5">{tx.customerPhone ?? "-"}</dd>
            </div>
          </dl>
        </Card>

        <Card padding="md">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">receipt_long</span>
            Informasi Transaksi
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Metode Pembayaran</dt>
              <dd className="text-text-primary mt-0.5">{tx.paymentMethod ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Tanggal Transaksi</dt>
              <dd className="text-text-primary mt-0.5">
                {new Date(tx.created || tx.paymentDate || Date.now()).toLocaleString("id-ID", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Verifier</dt>
              <dd className="text-text-primary mt-0.5">{tx.verifiedBy ?? "-"}</dd>
            </div>
          </dl>
        </Card>

        {tx.paymentMethod === "MANUAL_TRANSFER" && (
          <Card padding="md" className="lg:col-span-2">
            <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-primary">upload_file</span>
              Bukti Transfer
            </h2>
            <PaymentProofActions transactionId={tx.id} />
          </Card>
        )}

        <Card padding="md" className="lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-text-primary font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-primary">mark_email_read</span>
                Pengiriman Tiket
              </h2>
              <p className="mt-1 text-sm text-text-tertiary">
                Download semua tiket transaksi atau kirim ulang ke email.
              </p>
            </div>
            <TicketDeliveryActions
              transactionId={tx.id}
              customerName={tx.customerName}
              customerEmail={tx.customerEmail}
              ticketCount={ticketCount}
            />
          </div>
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">confirmation_number</span>
            Detail Tiket
          </h2>
          <div className="space-y-3">
            {detail.ticketDetails.length === 0 && (
              <p className="text-sm text-text-tertiary">Belum ada tiket pada transaksi ini.</p>
            )}

            {detail.ticketDetails.map((item) => (
              <div key={item.category.id} className="border border-border-subtle rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-text-primary font-semibold">{item.category.name}</p>
                    <p className="text-sm text-text-tertiary">Qty: {item.ticketCount}</p>
                  </div>
                  <p className="text-text-primary font-bold">{formatIDR(item.subtotalPrice)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border-subtle mt-4 pt-4 flex items-center justify-between">
            <span className="text-text-primary font-semibold">Total Pembayaran</span>
            <span className="text-text-primary font-bold text-lg">{formatIDR(tx.totalPrice)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
