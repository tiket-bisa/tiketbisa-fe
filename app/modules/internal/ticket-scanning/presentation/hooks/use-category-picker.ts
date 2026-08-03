import { useMemo } from "react";
import { useApiQuery } from "~/core/api";
import { internalEventApi, normalizeInternalEvent } from "~/core/api/services/internal-event.api";
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
export function useCategoryPicker(brandId?: string) {
  const { data, loading, error, refetch } = useApiQuery(async () => {
    const eventsRes = await internalEventApi.getList({ limit: 100, offset: 0, brandId });
    if (!eventsRes.success || !eventsRes.data) return [] as CategoryPickerEvent[];

    return (eventsRes.data.events ?? []).map(
      (raw): CategoryPickerEvent => {
        const evt = normalizeInternalEvent(raw);
        return { id: evt.id, name: evt.name };
      },
    );
  }, [brandId]);

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
