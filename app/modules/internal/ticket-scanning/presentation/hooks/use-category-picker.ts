import { useMemo } from "react";
import { useApiQuery } from "~/core/api";
import { eventApi } from "~/core/api/services/event.api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import { ticketCategoryApi, type TicketCategoryApiData } from "~/core/api/services/ticket-category.api";

export interface CategoryPickerEvent {
  id: string;
  name: string;
  brandName?: string;
}

/**
 * Loads the list of events (optionally scoped to a single brand) for the scan
 * "expected_category_id" picker — WITHOUT their ticket categories. Categories are loaded lazily,
 * per selected event, via {@link useEventCategories}. This keeps opening the picker at a constant
 * 1–2 requests instead of firing one getByEvent call per event (which for an admin with dozens or
 * hundreds of events would flood the backend and stall the browser's connection pool).
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

    return (eventsRes.data.events ?? []).map(
      (evt): CategoryPickerEvent => ({
        id: evt.id,
        name: evt.name,
        brandName: brandsMap.get(evt.brand_id)?.name,
      }),
    );
  }, [brandSlug]);

  const events = useMemo(() => data ?? [], [data]);

  return { events, loading, error, refetch };
}

/**
 * Lazily loads the ticket categories for a single event. It only hits the backend once
 * {@code eventId} is set (i.e. after the user picks an event in the first dropdown), so we never
 * fan out a category request per event up-front.
 */
export function useEventCategories(eventId?: string) {
  const { data, loading, error } = useApiQuery(async () => {
    if (!eventId) return [] as TicketCategoryApiData[];
    const catRes = await ticketCategoryApi.getByEvent(eventId);
    if (!catRes.success || !catRes.data) return [] as TicketCategoryApiData[];
    return Array.isArray(catRes.data) ? catRes.data : [];
  }, [eventId]);

  const categories = useMemo(() => data ?? [], [data]);

  return { categories, loading, error };
}
