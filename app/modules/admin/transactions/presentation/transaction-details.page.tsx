import { useParams, Link } from "react-router";
import { Card, Badge } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
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
  const tx = allTransactions.find((t) => t.id === id);

  if (!tx) {
    return (
      <div className="space-y-4">
        <Link to="/internal/admin" className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
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

  const status = STATUS_MAP[tx.status];

  return (
    <div className="space-y-6">
      <Link to="/internal/admin" className="text-brand-primary text-sm hover:underline inline-flex items-center gap-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-primary">person</span>
            Pembeli
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Nama</dt>
              <dd className="text-text-primary mt-0.5">{tx.buyer_name}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Email</dt>
              <dd className="text-text-primary mt-0.5">{tx.buyer_email}</dd>
            </div>
            {tx.buyer_phone && (
              <div>
                <dt className="text-text-tertiary text-xs uppercase tracking-wide">Telepon</dt>
                <dd className="text-text-primary mt-0.5">{tx.buyer_phone}</dd>
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
              <dd className="text-text-primary mt-0.5">{tx.event_name}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Metode Pembayaran</dt>
              <dd className="text-text-primary mt-0.5">{tx.payment_method ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-text-tertiary text-xs uppercase tracking-wide">Tanggal Transaksi</dt>
              <dd className="text-text-primary mt-0.5">
                {new Date(tx.created_at).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
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
                  <td className="px-4 py-3 text-text-primary">{tx.ticket_name}</td>
                  <td className="px-4 py-3 text-text-secondary text-right">{tx.quantity}</td>
                  <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(tx.total_price)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-border-default">
                  <td colSpan={2} className="px-4 py-3 text-text-primary font-semibold">Total Pembayaran</td>
                  <td className="px-4 py-3 text-text-primary text-right font-bold text-lg">{formatIDR(tx.total_price)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
