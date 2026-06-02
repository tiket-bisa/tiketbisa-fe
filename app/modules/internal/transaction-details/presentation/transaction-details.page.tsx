import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge, Button, Card } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import { transactionApi } from "~/core/api/services/transaction.api";
import { formatIDR } from "~/core/utils";

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default" }> = {
  WAITING_PAYMENT: { label: "Menunggu Pembayaran", variant: "warning" },
  WAITING_APPROVAL: { label: "Menunggu Approval", variant: "warning" },
  PAID: { label: "Lunas", variant: "success" },
  COMPLETED: { label: "Selesai", variant: "success" },
  CANCELED: { label: "Dibatalkan", variant: "destructive" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "destructive" },
};

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/** Partner — Transaction Details (only shows partner-accessible transactions) */
export default function TransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isProofLoading, setIsProofLoading] = useState(false);
  const returnTo = "/internal-tb/partner";

  const { data: detail, loading } = useApiQuery(
    async () => {
      if (!id) return null;
      const response = await transactionApi.getDetail(id);
      if (!response.success || !response.data) return null;
      return response.data;
    },
    [id],
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="text-center py-16">
          <p className="text-text-tertiary">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (!detail || !detail.transaction) {
    return (
      <div className="space-y-4">
        <BackLink />
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
      alert(error instanceof Error ? error.message : "Gagal memproses approval");
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleOpenProof = async (download: boolean) => {
    if (!id) return;
    setIsProofLoading(true);
    try {
      const response = await transactionApi.getPaymentProof(id);
      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Bukti transfer tidak ditemukan");
      }

      const file = response.data;

      if (file.signedUrl) {
        if (download) {
          const downloadResponse = await transactionApi.downloadPaymentProof(id);
          if (!downloadResponse.success || !downloadResponse.data) {
            throw new Error(downloadResponse.error ?? "Gagal download bukti transfer");
          }

          const url = URL.createObjectURL(downloadResponse.data.blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = downloadResponse.data.fileName || `payment-proof-${id}`;
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } else {
          const anchor = document.createElement("a");
          anchor.href = file.signedUrl;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          document.body.appendChild(anchor);
          anchor.click();
          anchor.remove();
        }
        return;
      }

      if (!file.base64Content) {
        throw new Error("Bukti transfer tidak tersedia");
      }

      const blob = base64ToBlob(file.base64Content, file.mimeType || "application/octet-stream");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      if (download) {
        anchor.download = file.fileName || `payment-proof-${id}`;
      }
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal membuka bukti transfer");
    } finally {
      setIsProofLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BackLink />

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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                onClick={() => handleOpenProof(false)}
                isLoading={isProofLoading}
              >
                Buka Bukti Transfer
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleOpenProof(true)}
                isLoading={isProofLoading}
              >
                Download Bukti Transfer
              </Button>
            </div>
          </Card>
        )}

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

function BackLink() {
  return (
    <Link to="/internal-tb/partner" className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
      <span className="material-symbols-outlined text-sm">arrow_back</span>
      Kembali ke Beranda
    </Link>
  );
}
