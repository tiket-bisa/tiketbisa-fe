import { useParams, Link } from "react-router";
import { Card, Badge } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { useApiQuery } from "~/core/api";
import { transactionApi } from "~/core/api/services/transaction.api";
import { allTransactions } from "../../dashboard/infrastructure/transaction.mock";

const STATUS_MAP = {
  paid: { label: "Lunas", variant: "success" as const },
  pending: { label: "Menunggu", variant: "warning" as const },
  cancelled: { label: "Dibatalkan", variant: "destructive" as const },
  refunded: { label: "Refund", variant: "default" as const },
};

/** Admin — Transaction Details */
export default function AdminTransactionDetailsPage() {
  const { id } = useParams<{ id: string }>();

  // Try to fetch from real API first
  const { data: apiTx, loading, error } = useApiQuery(
    async () => {
      if (!id) return null;
      const res = await transactionApi.getStatus(id);
      if (res.success && res.data) return res.data;
      return null;
    },
    [id],
  );

  // Fallback to mock data if API returns nothing (e.g. mock transaction IDs like TRX-001)
  const tx = apiTx
    ? (apiTx as Record<string, unknown>)
    : allTransactions.find((t) => t.id === id);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link to="/internal/admin" className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Kembali ke Dashboard
        </Link>
        <div className="text-center py-16">
          <p className="text-text-tertiary">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="space-y-4">
        <Link to="/internal-tb/admin" className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
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

  // Normalize fields, supports both API and mock data shapes
  const txData = {
    id: (tx as any).id ?? id,
    event_name: (tx as any).event_name ?? (tx as any).eventName ?? "-",
    buyer_name: (tx as any).buyer_name ?? (tx as any).customerName ?? "-",
    buyer_email: (tx as any).buyer_email ?? (tx as any).customerEmail ?? "-",
    buyer_phone: (tx as any).buyer_phone ?? (tx as any).customerPhone ?? null,
    ticket_name: (tx as any).ticket_name ?? "-",
    quantity: (tx as any).quantity ?? 0,
    total_price: (tx as any).total_price ?? (tx as any).totalPrice ?? 0,
    status: ((tx as any).status ?? "pending") as keyof typeof STATUS_MAP,
    payment_method: (tx as any).payment_method ?? (tx as any).paymentMethod ?? null,
    created_at: (tx as any).created_at ?? (tx as any).paymentDate ?? new Date().toISOString(),
  };

  const status = STATUS_MAP[txData.status] ?? STATUS_MAP.pending;

  return (
    <div className="space-y-6">
      <Link to="/internal-tb/admin" className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Kembali ke Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Detail Transaksi</h1>
          <p className="text-text-tertiary text-sm font-mono mt-1">{txData.id}</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">person</span>
            Pembeli
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Nama</dt>
              <dd className="text-text-primary mt-0.5">{txData.buyer_name}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-text-primary mt-0.5">{txData.buyer_email}</dd>
            </div>
            {txData.buyer_phone && (
              <div>
                <dt className="text-text-tertiary text-xs uppercase tracking-wide">Telepon</dt>
                <dd className="text-text-primary mt-0.5">{txData.buyer_phone}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card padding="md">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">receipt_long</span>
            Informasi Transaksi
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Event</dt>
              <dd className="text-text-primary mt-0.5">{txData.event_name}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Metode Pembayaran</dt>
              <dd className="text-text-primary mt-0.5">{txData.payment_method ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Tanggal Transaksi</dt>
              <dd className="text-text-primary mt-0.5">
                {new Date(txData.created_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
              </dd>
            </div>
          </dl>
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">confirmation_number</span>
            Tiket
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2 font-medium">Tiket</th>
                  <th className="text-right px-4 py-2 font-medium">Jumlah</th>
                  <th className="text-right px-4 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border-subtle">
                  <td className="px-4 py-3 text-text-primary">{txData.ticket_name}</td>
                  <td className="px-4 py-3 text-text-secondary text-right">{txData.quantity}</td>
                  <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(txData.total_price)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-border-default">
                  <td colSpan={2} className="px-4 py-3 text-text-primary font-semibold">Total Pembayaran</td>
                  <td className="px-4 py-3 text-text-primary text-right font-bold text-lg">{formatIDR(txData.total_price)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
