import { useMemo, useState } from "react";
import { Button, Card, Input, Select } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import { formatIDR } from "~/core/utils";
import { promoAdminApi, type PromoData, type PromoType } from "../infrastructure/promo.api";

interface PromoFormState {
  id?: string;
  code: string;
  brandId: string;
  type: PromoType;
  value: string;
  maxDiscount: string;
  quota: string;
  usedCount: number;
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: PromoFormState = {
  code: "", brandId: "", type: "PERCENT", value: "", maxDiscount: "", quota: "",
  usedCount: 0, startsAt: "", endsAt: "",
};

function toLocalDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toPayload(form: PromoFormState): PromoData {
  return {
    ...(form.id ? { id: form.id } : {}),
    code: form.code.trim().toUpperCase(),
    brandId: form.brandId || null,
    type: form.type,
    value: Number(form.value),
    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
    quota: form.quota ? Number(form.quota) : null,
    usedCount: form.usedCount,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    recordFlag: 1,
  };
}

export default function PromosPage() {
  const [form, setForm] = useState<PromoFormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const { data: promos, loading, error, refetch } = useApiQuery(() => promoAdminApi.list(), []);
  const { data: brands } = useApiQuery(async () => {
    const response = await brandApi.getList({ limit: 100, offset: 0 });
    return response.success && response.data ? (response.data.brands ?? []).map(mapBrandApiToFe) : [];
  }, []);

  const brandNames = useMemo(() => new Map((brands ?? []).map((brand) => [brand.id, brand.name])), [brands]);
  const brandOptions = [
    { value: "", label: "Semua brand (global)" },
    ...(brands ?? []).map((brand) => ({ value: brand.id, label: brand.name })),
  ];

  const setField = (field: keyof PromoFormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const editPromo = (promo: PromoData) => setForm({
    id: promo.id,
    code: promo.code,
    brandId: promo.brandId ?? "",
    type: promo.type,
    value: String(promo.value),
    maxDiscount: promo.maxDiscount == null ? "" : String(promo.maxDiscount),
    quota: promo.quota == null ? "" : String(promo.quota),
    usedCount: Number(promo.usedCount ?? 0),
    startsAt: toLocalDateTime(promo.startsAt),
    endsAt: toLocalDateTime(promo.endsAt),
  });

  const savePromo = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    if (!form.code.trim() || !(Number(form.value) > 0)) {
      setFeedback({ type: "error", message: "Kode dan nilai promo wajib diisi." });
      return;
    }
    if (form.endsAt && form.startsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      setFeedback({ type: "error", message: "Waktu selesai harus setelah waktu mulai." });
      return;
    }
    setIsSaving(true);
    const response = form.id
      ? await promoAdminApi.update(form.id, toPayload(form))
      : await promoAdminApi.create(toPayload(form));
    setIsSaving(false);
    if (!response.success) {
      setFeedback({ type: "error", message: response.error || "Gagal menyimpan promo." });
      return;
    }
    setForm(EMPTY_FORM);
    setFeedback({ type: "success", message: "Promo berhasil disimpan." });
    await refetch();
  };

  const deactivatePromo = async (promo: PromoData) => {
    if (!promo.id || !window.confirm(`Nonaktifkan promo ${promo.code}?`)) return;
    const response = await promoAdminApi.deactivate(promo.id);
    if (!response.success) {
      setFeedback({ type: "error", message: response.error || "Gagal menonaktifkan promo." });
      return;
    }
    if (form.id === promo.id) setForm(EMPTY_FORM);
    setFeedback({ type: "success", message: "Promo dinonaktifkan." });
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Promo</h1>
        <p className="mt-1 text-sm text-text-tertiary">Kelola kode promo global atau khusus brand.</p>
      </div>

      <Card padding="lg">
        <form className="space-y-4" onSubmit={savePromo}>
          <h2 className="font-semibold text-text-primary">{form.id ? "Edit Promo" : "Promo Baru"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Kode Promo" value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} />
            <Select label="Brand" options={brandOptions} value={form.brandId} onChange={(e) => setField("brandId", e.target.value)} />
            <Select label="Tipe" options={[{ value: "PERCENT", label: "Persen" }, { value: "FLAT", label: "Nominal" }]} value={form.type} onChange={(e) => setField("type", e.target.value)} />
            <Input label={form.type === "PERCENT" ? "Nilai (%)" : "Nilai (Rp)"} type="number" min="1" value={form.value} onChange={(e) => setField("value", e.target.value)} />
            <Input label="Maksimum Diskon (opsional)" type="number" min="0" value={form.maxDiscount} onChange={(e) => setField("maxDiscount", e.target.value)} />
            <Input label="Kuota (opsional)" type="number" min="1" value={form.quota} onChange={(e) => setField("quota", e.target.value)} />
            <Input label="Mulai (opsional)" type="datetime-local" value={form.startsAt} onChange={(e) => setField("startsAt", e.target.value)} />
            <Input label="Selesai (opsional)" type="datetime-local" value={form.endsAt} onChange={(e) => setField("endsAt", e.target.value)} />
          </div>
          {feedback && <p className={`text-sm ${feedback.type === "error" ? "text-destructive-text" : "text-success-text"}`}>{feedback.message}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" isLoading={isSaving}>{form.id ? "Simpan Perubahan" : "Buat Promo"}</Button>
            {form.id && <Button type="button" variant="ghost" onClick={() => setForm(EMPTY_FORM)}>Batal</Button>}
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-text-primary">Promo Aktif</h2>
        {loading && <p className="text-sm text-text-tertiary">Memuat promo...</p>}
        {error && <p className="text-sm text-destructive-text">{error}</p>}
        {(promos ?? []).map((promo) => (
          <Card key={promo.id ?? promo.code} padding="md">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-bold text-text-primary">{promo.code}</p>
                <p className="text-sm text-text-secondary">
                  {promo.type === "PERCENT" ? `${promo.value}%` : formatIDR(promo.value)} · {promo.brandId ? brandNames.get(promo.brandId) ?? promo.brandId : "Global"}
                  {promo.quota != null ? ` · ${promo.usedCount ?? 0}/${promo.quota} terpakai` : " · tanpa kuota"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => editPromo(promo)}>Edit</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => deactivatePromo(promo)}>Nonaktifkan</Button>
              </div>
            </div>
          </Card>
        ))}
        {!loading && !error && (promos ?? []).length === 0 && <p className="text-sm text-text-tertiary">Belum ada promo aktif.</p>}
      </div>
    </div>
  );
}
