import { useMemo } from "react";
import { useApiQuery } from "~/core/api";
import { eventApi } from "~/core/api/services/event.api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import { ticketCategoryApi, type TicketCategoryApiData } from "~/core/api/services/ticket-category.api";

export interface CategoryPickerEvent {
  id: string;
  name: string;
  brandName?: string;
  categories: TicketCategoryApiData[];
}

/**
 * Loads events (optionally scoped to a single brand) with their ticket categories,
 * for the scan "expected_category_id" picker. Pass `brandSlug` for partner/scanner
 * accounts (own brand only); omit it for admin (sees every brand's events).
 */
export function useCategoryPicker(brandSlug?: string) {
  const { data, loading, error, refetch } = useApiQuery(async () => {
    const brandsRes = await brandApi.getList({ limit: 100, offset: 0 });
    const brandsMap = new Map<string, { name: string; slug: string }>();
    if (brandsRes.success && brandsRes.data) {
      for (const b of brandsRes.data.brands ?? []) {
        const fe = mapBrandApiToFe(b);
        brandsMap.set(b.id, { name: fe.name, slug: fe.slug });
      }
    }

    let brandId: string | undefined;
    if (brandSlug) {
      for (const [id, info] of brandsMap.entries()) {
        if (info.slug === brandSlug) {
          brandId = id;
          break;
        }
      }
      if (!brandId) return [] as CategoryPickerEvent[];
    }

    const eventsRes = await eventApi.getList({ limit: 100, offset: 0, brandId });
    if (!eventsRes.success || !eventsRes.data) return [] as CategoryPickerEvent[];

    const events = eventsRes.data.events ?? [];
    const results = await Promise.all(
      events.map(async (evt): Promise<CategoryPickerEvent | null> => {
        const catRes = await ticketCategoryApi.getByEvent(evt.id);
        if (!catRes.success || !catRes.data) return null;
        const categories = Array.isArray(catRes.data) ? catRes.data : [];
        if (categories.length === 0) return null;
        return {
          id: evt.id,
          name: evt.name,
          brandName: brandsMap.get(evt.brand_id)?.name,
          categories,
        };
      }),
    );

    return results.filter((r): r is CategoryPickerEvent => r !== null);
  }, [brandSlug]);

  const events = useMemo(() => data ?? [], [data]);

  return { events, loading, error, refetch };
}
