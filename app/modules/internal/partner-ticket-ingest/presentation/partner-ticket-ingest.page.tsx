import { useState } from "react";
import { Card, Button, Input, Select } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { useApiQuery } from "~/core/api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import { partnerTicketApi } from "../infrastructure/partner-ticket.api";

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
  const [partner, setPartner] = useState("");
  const [codesRaw, setCodesRaw] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);

  const brandOptions = (brandsData ?? []).map((b) => ({ value: b.id, label: b.name }));
  const effectiveBrandId = isAdmin ? brandId : user?.brand_id ?? "";
  const codes = parseCodes(codesRaw);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    if (!effectiveBrandId) {
      setError("Pilih brand terlebih dahulu.");
      return;
    }
    if (!partner.trim()) {
      setError("Nama partner wajib diisi.");
      return;
    }
    if (codes.length === 0) {
      setError("Masukkan minimal satu kode tiket.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await partnerTicketApi.ingest({
        brand_id: effectiveBrandId,
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
              onChange={(e) => setBrandId(e.target.value)}
              disabled={loadingBrands || isSubmitting}
            />
          )}

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
            <p className="text-xs text-text-tertiary">{codes.length} kode terdeteksi</p>
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
