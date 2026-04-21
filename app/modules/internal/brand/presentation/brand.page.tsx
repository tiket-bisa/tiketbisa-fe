import { Card, Avatar } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { useApiQuery } from "~/core/api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";

/** Partner — Brand detail page (shows partner's own brand info) */
export default function BrandPage() {
  const { user } = useAuth();

  const { data: brand, loading, error } = useApiQuery(
    async () => {
      const res = await brandApi.getList({ limit: 100, offset: 0 });
      if (!res.success || !res.data) return null;
      for (const b of res.data.brands ?? []) {
        const fe = mapBrandApiToFe(b);
        if (fe.slug === user?.brand_slug) return fe;
      }
      return null;
    },
    [user?.brand_slug],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">Memuat data brand...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">
          {error ? `Gagal memuat data: ${error}` : "Brand tidak ditemukan"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Brand</h1>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar src={brand.logo_url} fallback={brand.name} size="xl" />
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-text-primary text-xl font-bold">{brand.name}</h2>
            {brand.description && (
              <p className="text-text-secondary text-sm">{brand.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-xs text-text-tertiary">
              <span className="bg-surface-hover px-2 py-1 rounded">ID: {brand.id}</span>
              <span className="bg-surface-hover px-2 py-1 rounded">Slug: {brand.slug}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
