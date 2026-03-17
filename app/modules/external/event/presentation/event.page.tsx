import { useSearchParams, useNavigate } from "react-router";
import { Pagination, Select } from "~/core/design-system/components";
import {
  EventCard,
  FilterBar,
  SectionHeader,
  EmptyState,
} from "~/shared/components";
import { eventApi } from "../infrastructure/event.api";
import type { EventFilterParams } from "../infrastructure/event-filter.params";
import type { Event } from "../domain/event.entity";
import { EVENT_FILTERS, SORT_OPTIONS, EVENT_PAGE_SIZE } from "./constants";
import type { Route } from "./+types/event.page";

// SSR Loader //
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sp = url.searchParams;

  const limit = Number(sp.get("limit") ?? EVENT_PAGE_SIZE);
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const offset = (page - 1) * limit;

  const params: EventFilterParams = {
    limit,
    offset,
    order_by: sp.get("sort") ?? undefined,
    brand_name: sp.get("brand") ?? undefined,
    city: sp.get("city") ?? undefined,
    category: sp.get("category") ?? undefined,
    time_range: sp.get("time") ?? undefined,
    price_range: sp.get("price") ?? undefined,
    search: sp.get("q") ?? undefined,
  };

  const response = await eventApi.getEvents(params);

  return {
    events: response.data.event_list as Event[],
    count: response.data.count,
    limit: response.data.limit,
    offset: response.data.offset,
    currentPage: page,
  };
}

// Page Component //
export default function EventPage({ loaderData }: Route.ComponentProps) {
  const { events, count, limit, currentPage } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();

  const totalPages = Math.ceil(count / limit);

  /* Filter handlers */
  const sortValue = searchParams.get("sort") ?? "";
  const filterValues: Record<string, string> = {
    time: searchParams.get("time") ?? "",
    city: searchParams.get("city") ?? "",
    category: searchParams.get("category") ?? "",
    price: searchParams.get("price") ?? "",
  };

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      // Reset to page 1 when filters change
      next.delete("page");
      return next;
    });
  }

  function resetFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // Data-driven reset: clear all keys defined in our filter config
      EVENT_FILTERS.forEach((f) => next.delete(f.key));
      next.delete("page");
      return next;
    });
  }

  function handlePageChange(page: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (page <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(page));
      }
      return next;
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Title */}
      <SectionHeader title="Upcoming Events" className="mb-6" />

      {/* Filters + Sort Row */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-10">
        <FilterBar
          searchValue=""
          onSearchChange={() => {}}
          showSearch={false}
          filters={EVENT_FILTERS}
          filterValues={filterValues}
          onFilterChange={(key, value) => updateParam(key, value)}
          onReset={resetFilters}
          className="flex-1"
        />
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-text-tertiary whitespace-nowrap hidden sm:block">
            Urutkan:
          </label>
          <Select
            options={SORT_OPTIONS}
            value={sortValue}
            onChange={(e) => updateParam("sort", e.currentTarget.value)}
            placeholder="Pilih Urutan"
            className="w-auto min-w-[180px]"
          />
        </div>
      </div>

      {/* Event Grid or Empty State */}
      {events.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  id: event.id,
                  title: event.name,
                  imageUrl: event.imageUrl,
                  date: event.date,
                  location: event.location,
                  minPrice: event.minPrice,
                  tickets: event.tickets,
                  brandName: event.brand,
                }}
              />
            ))}
          </div>

          {/* Pagination — bottom right */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-text-tertiary whitespace-nowrap hidden sm:block">
                Show:
              </label>
              <Select
                options={[
                  { value: "8", label: "8" },
                  { value: "12", label: "12" },
                  { value: "24", label: "24" },
                  { value: "48", label: "48" },
                ]}
                value={String(limit)}
                onChange={(e) => updateParam("limit", e.currentTarget.value)}
                placeholder="Show"
                className="w-24"
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      ) : (
        <EmptyState
          title="Tidak ada event ditemukan"
          description="Coba ubah filter atau kata kunci pencarian kamu."
        />
      )}
    </section>
  );
}
