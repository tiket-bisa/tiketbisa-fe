import type { PaginatedApiResponse } from "~/core/api";
import type { Event } from "./event.entity";
import type { EventFilterParams } from "../infrastructure/event-filter.params";

/**
 * EventRepository — Port (domain interface)
 *
 * The presentation layer depends on this interface, not the concrete
 * implementation. Swap `event.api.ts` from dummy → real fetch
 * without touching the page code.
 */
export interface EventRepository {
  getEvents(params: EventFilterParams): Promise<PaginatedApiResponse<Event>>;
}
