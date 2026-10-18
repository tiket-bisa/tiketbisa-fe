import type { CommunityOverview, GenerationRow } from "./community.api";
import { Button } from "~/core/design-system/components";

export function groupGenerations(rows: GenerationRow[]) {
  const groups = new Map<string, GenerationRow[]>();
  for (const row of rows)
    groups.set(row.transaction_id, [
      ...(groups.get(row.transaction_id) ?? []),
      row,
    ]);
  return [...groups.entries()];
}
const statuses: Record<string, string> = {
  NOT_QUEUED: "Email belum masuk antrean",
  PROCESSING: "Menyiapkan email",
  PENDING: "Email dalam antrean",
  RETRY: "Email dijadwalkan ulang",
  ACCEPTED: "Diterima penyedia email",
  DELIVERED: "Email terkirim",
  FAILED: "Email gagal",
  SUPPRESSED: "Email diblokir penyedia",
};
export function CommunityHistory({
  overview,
  offset,
  onPage,
  onRetry,
  busy,
}: {
  overview: CommunityOverview;
  offset: number;
  onPage: (offset: number) => void;
  onRetry?: (id: string) => void;
  busy?: boolean;
}) {
  const groups = groupGenerations(overview.history);
  return (
    <div className="space-y-8">
      <section aria-labelledby="quota-summary">
        <h2 id="quota-summary" className="mb-3 text-lg font-semibold">
          Kuota per kategori
        </h2>
        {overview.quotas.length === 0 ? (
          <p className="text-text-secondary">
            Belum ada kategori bulk Komunitas pada event ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Alokasi</th>
                  <th className="p-3 text-right">Issued</th>
                  <th className="p-3 text-right">Sisa</th>
                </tr>
              </thead>
              <tbody>
                {overview.quotas.map((q) => (
                  <tr
                    key={q.category_id}
                    className="border-b border-border-subtle"
                  >
                    <th scope="row" className="p-3 font-medium">
                      {q.category_name}
                    </th>
                    <td className="p-3 text-right tabular-nums">{q.total}</td>
                    <td className="p-3 text-right tabular-nums">{q.issued}</td>
                    <td className="p-3 text-right font-semibold tabular-nums">
                      {q.total - q.issued}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section aria-labelledby="generation-history">
        <h2 id="generation-history" className="mb-3 text-lg font-semibold">
          Riwayat generate
        </h2>
        {groups.length === 0 ? (
          <p className="text-text-secondary">
            Belum ada aksi generate pada halaman ini.
          </p>
        ) : (
          <div className="divide-y divide-border-default">
            {groups.map(([id, rows]) => (
              <article key={id} className="space-y-2 py-4 first:pt-0">
                <p className="break-all text-sm font-medium">
                  {rows[0].customer_email}
                </p>
                <p className="text-xs text-text-secondary">
                  {new Date(rows[0].created).toLocaleString("id-ID", {
                    timeZone: "Asia/Jakarta",
                  })}{" "}
                  WIB · {rows[0].username}
                </p>
                <ul className="text-sm">
                  {rows.map((row) => (
                    <li key={row.category_id}>
                      {row.category_name}: <strong>{row.quantity} tiket</strong>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-text-secondary">
                  Transaksi: <span className="break-all">{id}</span>
                </p>
                <p className="text-sm">
                  {statuses[rows[0].delivery_status] ?? rows[0].delivery_status}
                </p>
                {onRetry &&
                  ["NOT_QUEUED", "FAILED", "DELIVERED", "ACCEPTED"].includes(
                    rows[0].delivery_status,
                  ) && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => onRetry(id)}
                    >
                      Kirim ulang email tiket
                    </Button>
                  )}
              </article>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={offset === 0 || busy}
            onClick={() => onPage(Math.max(0, offset - 100))}
          >
            Sebelumnya
          </Button>
          <span className="text-sm">
            Halaman {Math.floor(offset / 100) + 1}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={groups.length < 100 || busy}
            onClick={() => onPage(offset + 100)}
          >
            Berikutnya
          </Button>
        </div>
      </section>
      <section aria-labelledby="daily-report">
        <h2 id="daily-report" className="mb-1 text-lg font-semibold">
          Rekap harian
        </h2>
        <p className="mb-3 text-sm text-text-secondary">
          Jumlah issued per kategori sejak generate pertama. Pembayaran
          dilakukan di luar Tiketbisa.
        </p>
        {overview.daily.length === 0 ? (
          <p className="text-text-secondary">Belum ada tiket issued.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="p-3">Tanggal (WIB)</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Aksi</th>
                  <th className="p-3 text-right">Issued</th>
                </tr>
              </thead>
              <tbody>
                {overview.daily.map((row) => (
                  <tr
                    key={`${row.day}-${row.category_id}`}
                    className="border-b border-border-subtle"
                  >
                    <td className="p-3">{row.day}</td>
                    <th scope="row" className="p-3 font-medium">
                      {row.category_name}
                    </th>
                    <td className="p-3 text-right tabular-nums">
                      {row.actions}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {row.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
