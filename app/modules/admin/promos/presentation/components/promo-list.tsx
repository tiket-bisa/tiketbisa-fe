import { Button, Card } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import type { PromoData } from "../../infrastructure/promo.api";

interface PromoListProps {
  promos: PromoData[];
  brandNames: Map<string, string>;
  loading: boolean;
  error: string | null;
  deactivatingId: string | null;
  onEdit: (promo: PromoData) => void;
  onDeactivate: (promo: PromoData) => void;
}

function formatPeriod(promo: PromoData): string {
  if (!promo.startsAt && !promo.endsAt) return "Tanpa batas waktu";
  const format = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  return `${promo.startsAt ? format(promo.startsAt) : "Sekarang"} – ${promo.endsAt ? format(promo.endsAt) : "Seterusnya"}`;
}

export function PromoList({ promos, brandNames, loading, error, deactivatingId, onEdit, onDeactivate }: PromoListProps) {
  return (
    <section className="space-y-3" aria-labelledby="active-promos-title">
      <h2 id="active-promos-title" className="font-semibold text-text-primary">Promo Aktif</h2>
      {loading && <p className="text-sm text-text-tertiary">Memuat promo...</p>}
      {error && <p role="alert" className="text-sm text-destructive-text">{error}</p>}
      {promos.map((promo) => (
        <Card key={promo.id ?? promo.code} padding="md">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p className="font-bold text-text-primary">{promo.code}</p>
              <p className="text-sm text-text-secondary">
                {promo.type === "PERCENT" ? `${promo.value}%` : formatIDR(promo.value)} · {promo.brandId ? brandNames.get(promo.brandId) ?? promo.brandId : "Global"}
                {promo.maxDiscount != null ? ` · maks. ${formatIDR(promo.maxDiscount)}` : ""}
              </p>
              <p className="text-xs text-text-tertiary">
                {promo.quota != null ? `${promo.usedCount ?? 0}/${promo.quota} terpakai` : "Tanpa kuota"} · {formatPeriod(promo)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={deactivatingId !== null} onClick={() => onEdit(promo)}>Edit</Button>
              <Button type="button" variant="ghost" size="sm" isLoading={deactivatingId === promo.id} disabled={deactivatingId !== null} onClick={() => onDeactivate(promo)}>Nonaktifkan</Button>
            </div>
          </div>
        </Card>
      ))}
      {!loading && !error && promos.length === 0 && <p className="text-sm text-text-tertiary">Belum ada promo aktif.</p>}
    </section>
  );
}
