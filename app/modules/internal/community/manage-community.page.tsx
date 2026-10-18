import { useRef, useState } from "react";
import { useAuth } from "~/core/auth";
import { internalHttpClient, toUserFacingError } from "~/core/api";
import { internalEventApi } from "~/core/api/services/internal-event.api";
import { Button, Input, Select } from "~/core/design-system/components";
import { communityApi, useCommunityQuery, unwrap } from "./community.api";
import { CommunityHistory } from "./community-history";

export default function ManageCommunityPage() {
  const { user } = useAuth();
  const [selectedBrand, setSelectedBrand] = useState("");
  const brands = useCommunityQuery(async () => user?.role === "admin"
    ? (await unwrap(internalHttpClient.get<{ brands: { id: string; name: string }[] }>("/brand?limit=200&offset=0"))).brands : [], [user?.identifier]);
  const brandId = user?.role === "partner" ? user.brand_id : selectedBrand;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Komunitas</h1><p className="mt-2 text-text-secondary">Kelola akun klub, alokasikan kuota bulk, dan periksa tiket issued per hari.</p></div>
    {user?.role === "admin" && (brands.loading ? <p role="status">Memuat klub...</p> : brands.error ? <p role="alert">{brands.error}</p> : <Select id="community-brand" label="Klub" value={brandId} onChange={e => setSelectedBrand(e.target.value)} options={(brands.data ?? []).map(b => ({ value: b.id, label: b.name }))} placeholder="Pilih klub" className="text-base sm:text-sm" />)}
    {brandId && <ClubCommunities key={brandId} brandId={brandId} />}
  </div>;
}
function ClubCommunities({ brandId }: { brandId: string }) {
  const accounts = useCommunityQuery(() => communityApi.accounts(brandId), [brandId]);
  const events = useCommunityQuery(async () => (await unwrap(internalEventApi.getList({ brandId, limit: 200, offset: 0 }))).events, [brandId]);
  const [accountId, setAccountId] = useState("");
  const [eventId, setEventId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function action(operation: () => Promise<unknown>, success: string) {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try { await operation(); setMessage(success); accounts.refresh(); return true; }
    catch (e) { setError(toUserFacingError(e, "Perubahan belum dapat disimpan.")); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  const active = accounts.data?.find(a => a.id === accountId);
  return <div className="space-y-6">
    {error && <p role="alert" className="text-destructive-text">{error}</p>}
    {message && <p role="status">{message}</p>}
    <details className="rounded-xl border border-border-default p-4 sm:p-6">
      <summary className="cursor-pointer font-semibold">Buat akun komunitas</summary>
      <form className="mt-4 space-y-4" onSubmit={async e => { e.preventDefault(); if (await action(() => communityApi.create({ brandId, username, password }), "Akun komunitas berhasil dibuat.")) { setUsername(""); setPassword(""); } }}>
        <p className="text-sm text-text-secondary">Satu akun terhubung ke klub ini. Username menjadi nama pada tiket.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="new-community-username" label="Username komunitas" autoComplete="off" required pattern="[a-zA-Z0-9._-]{3,100}" hint="3–100 karakter: huruf, angka, titik, garis bawah, atau tanda minus." value={username} onChange={e => setUsername(e.target.value)} disabled={busy} className="text-base sm:text-sm" />
          <Input id="new-community-password" label="Password" type="password" autoComplete="new-password" required minLength={6} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} className="text-base sm:text-sm" />
        </div><Button type="submit" isLoading={busy}>Buat akun</Button>
      </form>
    </details>
    {accounts.loading || events.loading ? <p role="status">Memuat akun dan event...</p> : accounts.error || events.error ? <div role="alert">{accounts.error ?? events.error} <Button variant="secondary" onClick={() => { accounts.refresh(); events.refresh(); }}>Muat ulang</Button></div> : <>
      {accounts.data?.length === 0 && <p>Belum ada akun komunitas. Buat akun untuk mulai mengalokasikan kuota.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select id="managed-community" label="Akun komunitas" placeholder="Pilih komunitas" value={accountId} onChange={e => setAccountId(e.target.value)} options={(accounts.data ?? []).map(a => ({ value: a.id, label: `${a.username}${a.record_flag === 1 ? "" : " (nonaktif)"}` }))} className="text-base sm:text-sm" />
        <Select id="managed-community-event" label="Event" placeholder="Pilih event" value={eventId} onChange={e => setEventId(e.target.value)} options={(events.data ?? []).map(e => ({ value: e.id, label: e.name }))} className="text-base sm:text-sm" />
      </div>
      {active && <div className="flex flex-wrap items-center gap-3"><p className="break-all text-sm">{active.username} · {active.record_flag === 1 ? "Aktif" : "Nonaktif"}</p><Button variant="secondary" disabled={busy} onClick={() => void action(() => communityApi.active(active.id, active.record_flag !== 1), "Status akun diperbarui.")}>{active.record_flag === 1 ? "Nonaktifkan akun" : "Aktifkan akun"}</Button></div>}
      {eventId && accountId && <CommunityAllocation key={`${eventId}-${accountId}`} eventId={eventId} accountId={accountId} />}
    </>}
  </div>;
}
function CommunityAllocation({ eventId, accountId }: { eventId: string; accountId: string }) {
  const [offset, setOffset] = useState(0);
  const overview = useCommunityQuery(() => communityApi.overview(eventId, accountId, offset), [eventId, accountId, offset]);
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function allocate(e: React.FormEvent) {
    e.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setMessage("");
    try { await communityApi.quota({ accountId, categoryId, quantity: Number(quantity) }); setQuantity(""); setMessage("Kuota komunitas dan total bulk event berhasil ditambah."); overview.refresh(); }
    catch (e) { setError(toUserFacingError(e, "Kuota belum dapat ditambah.")); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="space-y-6">
    {error && <p role="alert" className="text-destructive-text">{error}</p>}{message && <p role="status">{message}</p>}
    <Button variant="secondary" disabled={busy || overview.loading} onClick={overview.refresh}>Perbarui rekap</Button>
    {overview.loading ? <p role="status">Memuat kuota dan riwayat...</p> : overview.error ? <p role="alert">{overview.error}</p> : overview.data && <>
      <form onSubmit={allocate} className="space-y-4 rounded-xl border border-border-default p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Tambah kuota komunitas</h2>
        <p className="text-sm text-text-secondary">Penambahan ini juga menambah total kuota bulk kategori di Admin/Partner.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select id="allocation-category" label="Kategori bulk Komunitas" required placeholder="Pilih kategori" value={categoryId} onChange={e => setCategoryId(e.target.value)} options={overview.data.quotas.map(q => ({ value: q.category_id, label: q.category_name }))} disabled={busy} className="text-base sm:text-sm" />
          <Input id="allocation-quantity" label="Tambahan kuota" required type="number" inputMode="numeric" min={1} max={100000} step={1} value={quantity} onChange={e => setQuantity(e.target.value)} disabled={busy} className="text-base sm:text-sm" />
        </div>
        {overview.data.quotas.length === 0 && <p className="text-sm text-text-secondary">Buat kategori bulk bertipe Komunitas pada event ini terlebih dahulu.</p>}
        <Button type="submit" isLoading={busy} disabled={overview.data.quotas.length === 0}>Tambah kuota</Button>
      </form>
      <CommunityHistory overview={overview.data} offset={offset} onPage={setOffset} busy={busy} />
    </>}
  </div>;
}
