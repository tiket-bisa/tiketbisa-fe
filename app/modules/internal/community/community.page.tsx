import { useRef, useState } from "react";
import { useAuth } from "~/core/auth";
import { Button, Input, Select } from "~/core/design-system/components";
import { toUserFacingError } from "~/core/api";
import { communityApi, useCommunityQuery } from "./community.api";
import { CommunityHistory } from "./community-history";

export default function CommunityPage() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState("");
  const events = useCommunityQuery(communityApi.events, [user?.identifier]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tiket komunitas</h1>
        <p className="mt-2 text-text-secondary">
          Pilih event aktif untuk generate tiket sesuai kuota komunitasmu.
        </p>
      </div>
      {events.loading ? (
        <p role="status">Memuat event...</p>
      ) : events.error ? (
        <div role="alert">
          {events.error}{" "}
          <Button variant="secondary" onClick={events.refresh}>
            Muat ulang
          </Button>
        </div>
      ) : events.data?.length === 0 ? (
        <p>Belum ada event aktif untuk klub ini.</p>
      ) : (
        <Select
          id="community-event"
          label="Event aktif"
          className="text-base sm:text-sm"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          placeholder="Pilih event"
          options={(events.data ?? []).map((e) => ({
            value: e.id,
            label: e.name,
          }))}
        />
      )}
      {eventId && (
        <EventGeneration
          key={`${user?.identifier}-${eventId}`}
          eventId={eventId}
        />
      )}
    </div>
  );
}
function EventGeneration({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const overview = useCommunityQuery(
    () => communityApi.overview(eventId, "", offset),
    [eventId, offset],
  );
  const [email, setEmail] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const storageKey = `community-generation:${user?.identifier}:${eventId}`;
  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (locked.current || !overview.data) return;
    setError("");
    setMessage("");
    const tickets = overview.data.quotas
      .map((q) => ({
        categoryId: q.category_id,
        quantity: Number(quantities[q.category_id] ?? 0),
      }))
      .filter((i) => i.quantity > 0);
    if (!tickets.length) {
      setError("Isi jumlah pada minimal satu kategori.");
      return;
    }
    if (
      tickets.some((i) => !Number.isSafeInteger(i.quantity)) ||
      tickets.reduce((sum, i) => sum + i.quantity, 0) > 1000
    ) {
      setError("Jumlah harus bilangan bulat, maksimal 1000 tiket per aksi.");
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      const payload = { eventId, email: email.trim(), tickets };
      const fingerprint = JSON.stringify(payload);
      let prior: { fingerprint: string; requestId: string } | null = null;
      try {
        prior = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
      } catch {
        /* replace malformed saved request */
      }
      const requestId =
        prior?.fingerprint === fingerprint
          ? prior.requestId
          : crypto.randomUUID();
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ fingerprint, requestId }),
      );
      const result = await communityApi.generate({ ...payload, requestId });
      sessionStorage.removeItem(storageKey);
      setMessage(
        `Tiket berhasil diterbitkan. Email sedang disiapkan. Transaksi: ${result.transactionId}`,
      );
      setQuantities({});
      setOffset(0);
      overview.refresh();
    } catch (e) {
      setError(
        `${toUserFacingError(e, "Generate belum dapat dikonfirmasi.")} Periksa riwayat atau coba lagi dengan input yang sama.`,
      );
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function retry(id: string) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await communityApi.retryEmail(id);
      setMessage(
        "Email tiket dimasukkan ke antrean lagi. Kuota tidak dipotong lagi.",
      );
      overview.refresh();
    } catch (e) {
      setError(toUserFacingError(e, "Email belum dapat diproses."));
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="break-words text-destructive-text">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="break-words text-success-text">
          {message}
        </p>
      )}
      <div className="flex justify-end">
        <Button
          variant="secondary"
          disabled={busy || overview.loading}
          onClick={overview.refresh}
        >
          Perbarui kuota & riwayat
        </Button>
      </div>
      {overview.loading ? (
        <p role="status">Memuat kuota dan riwayat...</p>
      ) : overview.error ? (
        <p role="alert">{overview.error}</p>
      ) : (
        overview.data && (
          <>
            <form
              onSubmit={generate}
              className="space-y-4 rounded-xl border border-border-default p-4 sm:p-6"
            >
              <h2 className="text-lg font-semibold">Generate tiket</h2>
              <p className="text-sm text-text-secondary">
                Nama pada tiket: <strong>{user?.username}</strong>. Isi jumlah
                pada kategori yang ingin diterbitkan.
              </p>
              <Input
                id="community-email"
                label="Email penerima"
                type="email"
                autoComplete="email"
                maxLength={255}
                required
                className="text-base sm:text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {overview.data.quotas
                  .filter((q) => q.total > 0)
                  .map((q) => (
                    <Input
                      key={q.category_id}
                      id={`quantity-${q.category_id}`}
                      label={q.category_name}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={Math.min(1000, q.total - q.issued)}
                      step={1}
                      className="text-base sm:text-sm"
                      hint={`Sisa kuota: ${q.total - q.issued}`}
                      value={quantities[q.category_id] ?? ""}
                      disabled={busy || q.total === q.issued}
                      onChange={(e) =>
                        setQuantities((current) => ({
                          ...current,
                          [q.category_id]: e.target.value,
                        }))
                      }
                    />
                  ))}
              </div>
              {overview.data.quotas.every((q) => q.total === q.issued) && (
                <p className="text-sm text-text-secondary">
                  Tidak ada sisa kuota. Hubungi pengelola klub untuk penambahan
                  kuota.
                </p>
              )}
              <Button
                type="submit"
                isLoading={busy}
                disabled={overview.data.quotas.every(
                  (q) => q.total === q.issued,
                )}
              >
                Generate dan kirim tiket
              </Button>
            </form>
            <CommunityHistory
              overview={overview.data}
              offset={offset}
              onPage={setOffset}
              onRetry={retry}
              busy={busy}
            />
          </>
        )
      )}
    </div>
  );
}
