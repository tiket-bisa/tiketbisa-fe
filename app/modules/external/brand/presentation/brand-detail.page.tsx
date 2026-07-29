import { getPaginationFromSearchParams } from "~/core/api";
import { useBrand } from "~/shared/hooks/use-brand";
import { brandApi } from "../infrastructure/brand.api";
import { eventApi } from "../../event/infrastructure/event.api";
import type { Event as DomainEvent } from "../../event/domain/event.entity";
import { BRAND_PAGE_SIZE } from "./constants";
import { BrandDetailHeader } from "./components/brand-detail-header";
import { BrandDetailEvents } from "./components/brand-detail-events";
import type { Route } from "./+types/brand-detail.page";

export async function loader({ request, params }: Route.LoaderArgs) {
  const slug = params.slug;
  if (!slug) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const { limit, offset, page } = getPaginationFromSearchParams(
    url.searchParams,
    BRAND_PAGE_SIZE,
  );

  const activeTab = url.searchParams.get("tab") || "aktif";
  const sort = url.searchParams.get("sort") || "date_asc";

  const brand = await brandApi.getBrandBySlug(slug);
  if (!brand) throw new Response("Not Found", { status: 404 });

  const eventsResponse = await eventApi.getEvents({
      limit,
      offset,
      order_by: sort,
      brand_id: brand.id,
      status: activeTab === "lalu" ? "ENDED" : "ONGOING",
    });

  return {
    brand,
    events: eventsResponse.data.event_list as DomainEvent[],
    count: eventsResponse.data.count,
    limit: eventsResponse.data.limit,
    currentPage: page,
    activeTab,
    sortValue: sort,
  };
}

export default function BrandDetailPage({ loaderData }: Route.ComponentProps) {
  const { brand, events, count, limit, currentPage, activeTab, sortValue } =
    loaderData;
  const { updateParam } = useBrand();

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="min-h-screen bg-surface-primary pb-24" data-theme="dark">
      <BrandDetailHeader brand={brand} />

      <BrandDetailEvents
        events={events}
        activeTab={activeTab}
        onTabChange={(val) =>
          updateParam("tab", val, { preventScrollReset: true })
        }
        sortValue={sortValue}
        onSortChange={(val) =>
          updateParam("sort", val, { preventScrollReset: true })
        }
        currentPage={currentPage}
        totalPages={totalPages}
        limit={limit}
        onPageChange={(page) =>
          updateParam("page", String(page), {
            resetPage: false,
            preventScrollReset: true,
          })
        }
        onLimitChange={(limitValue) =>
          updateParam("limit", limitValue, { preventScrollReset: true })
        }
      />
    </div>
  );
}
