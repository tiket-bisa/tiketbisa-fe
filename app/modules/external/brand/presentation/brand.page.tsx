import { SectionHeader, EmptyState } from "~/shared/components";
import { getPaginationFromSearchParams } from "~/core/api";
import { BRAND_PAGE_SIZE } from "~/shared/constants/brand.constants";
import { useBrand } from "~/shared/hooks/use-brand";
import { brandApi } from "../infrastructure/brand.api";
import type { BrandFilterParams } from "../infrastructure/brand-filter.params";
import type { Brand } from "../domain/brand.entity";
import { BrandFilters } from "./components/brand-filters";
import { BrandGrid } from "./components/brand-grid";
import { BrandPagination } from "./components/brand-pagination";
import type { Route } from "./+types/brand.page";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const { limit, offset, page } = getPaginationFromSearchParams(
    url.searchParams,
    BRAND_PAGE_SIZE,
  );

  const params: BrandFilterParams = {
    limit,
    offset,
    order_by: url.searchParams.get("sort") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    location: url.searchParams.get("location") ?? undefined,
  };

  const response = await brandApi.getBrands(params);

  return {
    brands: response.data.brand_list as Brand[],
    count: response.data.count,
    limit: response.data.limit,
    offset: response.data.offset,
    currentPage: page,
  };
}

export default function BrandPage({
  loaderData,
}: Route.ComponentProps) {
  const { brands, count, limit, currentPage } = loaderData;
  const {
    sortValue,
    filterValues,
    updateParam,
    resetFilters,
    handlePageChange,
  } = useBrand();

  const totalPages = Math.ceil(count / limit);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <SectionHeader title="Brand Resmi" className="mb-6" />

      <BrandFilters
        sortValue={sortValue}
        filterValues={filterValues}
        onFilterChange={updateParam}
        onReset={resetFilters}
        onSortChange={(value) => updateParam("sort", value)}
      />

      {brands.length > 0 ? (
        <>
          <BrandGrid brands={brands} />

          <BrandPagination
            currentPage={currentPage}
            totalPages={totalPages}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={(value) => updateParam("limit", value)}
          />
        </>
      ) : (
        <EmptyState
          title="Tidak ada brand ditemukan"
          description="Coba ubah filter atau kata kunci pencarian kamu."
        />
      )}
    </section>
  );
}
