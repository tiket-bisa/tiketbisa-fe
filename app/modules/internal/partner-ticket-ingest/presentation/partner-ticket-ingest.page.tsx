import { useState, useEffect } from "react";
import { Card, Button, Input, Select } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { useApiQuery } from "~/core/api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import { internalEventApi, normalizeInternalEvent } from "~/core/api/services/internal-event.api";
import { ticketCategoryApi } from "~/core/api/services/ticket-category.api";
import { partnerTicketApi } from "../infrastructure/partner-ticket.api";

/** Max codes per ingest request; mirrors the backend PARTNER_TICKET_MAX_INGEST default. */
const MAX_CODES = 5000;

function parseCodes(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    ),
  );
}

/** Bulk-paste ingest of partner-issued ticket codes (admin: any brand, partner: own brand only). */
export default function PartnerTicketIngestPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: brandsData, loading: loadingBrands } = useApiQuery(async () => {
    if (!isAdmin) return [];
    const res = await brandApi.getList({ limit: 100, offset: 0 });
    if (!res.success || !res.data) return [];
    return (res.data.brands ?? []).map(mapBrandApiToFe);
  }, [isAdmin]);

  const [brandId, setBrandId] = useState("");
  const [eventId, setEventId] = useState("");
  const [ticketCategoryId, setTicketCategoryId] = useState("");
  const [partner, setPartner] = useState("");
  const [codesRaw, setCodesRaw] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  const brandOptions = (brandsData ?? []).map((b) => ({ value: b.id, label: b.name }));
  const effectiveBrandId = isAdmin ? brandId : user?.brand_id ?? "";

  const { data: eventsData, loading: loadingEvents } = useApiQuery(async () => {
    if (!effectiveBrandId) return [];
    const res = await internalEventApi.getList({
      brandId: effectiveBrandId, limit: 100, offset: 0, sortBy: "start_date:DESC",
    });
    if (!res.success || !res.data) return [];
    return (res.data.events ?? []).map(normalizeInternalEvent);
  }, [effectiveBrandId]);

  const { data: categoriesData, loading: loadingCategories } = useApiQuery(async () => {
    if (!eventId) return [];
    const res = await ticketCategoryApi.getByEvent(eventId);
    return res.success && res.data ? res.data : [];
  }, [eventId]);

  const eventOptions = (eventsData ?? []).map((event) => ({ value: event.id, label: event.name }));
  const categoryOptions = (categoriesData ?? []).map((category) => ({ value: category.id, label: category.name }));

  // parseCodes (split/trim/dedupe) is O(n) and can lag on a huge paste, so the live "detected"
  // count is computed on a debounce rather than on every keystroke; the authoritative parse runs
  // only on submit (handleSubmit).
  const [codeCount, setCodeCount] = useState(0);
  useEffect(() => {
    const handle = setTimeout(() => setCodeCount(parseCodes(codesRaw).length), 300);
    return () => clearTimeout(handle);
  }, [codesRaw]);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    if (!effectiveBrandId) {
      setError("Pilih brand terlebih dahulu.");
      return;
    }
    if (!eventId) {
      setError("Pilih event terlebih dahulu.");
      return;
    }
    if (!ticketCategoryId) {
      setError("Pilih kategori tiket terlebih dahulu.");
      return;
    }
    if (!partner.trim()) {
      setError("Nama partner wajib diisi.");
      return;
    }

    // Parse on submit (not on every keystroke) so a large paste never blocks typing.
    const codes = parseCodes(codesRaw);
    if (codes.length === 0) {
      setError("Masukkan minimal satu kode tiket.");
      return;
    }
    if (codes.length > MAX_CODES) {
      setError(
        `Maksimal ${MAX_CODES.toLocaleString("id-ID")} kode per unggahan. Bagi menjadi beberapa unggahan.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await partnerTicketApi.ingest({
        brand_id: effectiveBrandId,
        event_id: eventId,
        ticket_category_id: ticketCategoryId,
        partner: partner.trim(),
        codes,
      });

      if (res.success && res.data) {
        setResult({ inserted: res.data.inserted, skipped: res.data.skipped });
        setCodesRaw("");
      } else {
        setError(res.error || "Gagal mengimpor kode tiket.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengimpor kode tiket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Impor Tiket Partner</h1>
        <p className="text-text-tertiary text-sm mt-1">
          Tempel daftar kode tiket dari partner eksternal (satu kode per baris) untuk didaftarkan agar bisa di-scan.
        </p>
      </div>

      <Card padding="md">
        <div className="space-y-4">
          {isAdmin && (
            <Select
              label="Brand"
              placeholder={loadingBrands ? "Memuat brand..." : "Pilih brand"}
              options={brandOptions}
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setEventId("");
                setTicketCategoryId("");
              }}
              disabled={loadingBrands || isSubmitting}
            />
          )}

          <Select
            label="Event"
            placeholder={loadingEvents ? "Memuat event..." : "Pilih event"}
            options={eventOptions}
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setTicketCategoryId("");
            }}
            disabled={!effectiveBrandId || loadingEvents || isSubmitting}
          />

          <Select
            label="Kategori Tiket"
            placeholder={loadingCategories ? "Memuat kategori..." : "Pilih kategori"}
            options={categoryOptions}
            value={ticketCategoryId}
            onChange={(e) => setTicketCategoryId(e.target.value)}
            disabled={!eventId || loadingCategories || isSubmitting}
          />

          <Input
            label="Nama Partner"
            placeholder="contoh: Loket, Tokopedia, dll"
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary" htmlFor="partner-codes">
              Kode Tiket (satu per baris)
            </label>
            <textarea
              id="partner-codes"
              value={codesRaw}
              onChange={(e) => setCodesRaw(e.target.value)}
              disabled={isSubmitting}
              rows={10}
              placeholder={"KODE-001\nKODE-002\nKODE-003"}
              className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:bg-button-disabled disabled:text-text-tertiary disabled:cursor-not-allowed"
            />
            <p className={`text-xs ${codeCount > MAX_CODES ? "text-destructive-text" : "text-text-tertiary"}`}>
              {codeCount.toLocaleString("id-ID")} kode terdeteksi
              {codeCount > MAX_CODES
                ? ` — melebihi batas ${MAX_CODES.toLocaleString("id-ID")}`
                : ""}
            </p>
          </div>

          {error && <p className="text-sm text-destructive-text">{error}</p>}

          {result && (
            <p className="text-sm text-success-text">
              {result.inserted} berhasil, {result.skipped} duplikat dilewati
            </p>
          )}

          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting} fullWidth>
            {isSubmitting ? "Mengimpor..." : "Impor Kode Tiket"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
