import { BannerCarousel } from "~/shared/components";
import { landingApi } from "../infrastructure/landing.api";
import { useLandingFilters } from "./hooks/use-landing-filters";
import { PartnerSection } from "./components/partner-section";
import { FeaturedEvents } from "./components/featured-events";
import { UpcomingEvents } from "./components/upcoming-events";
import type { Route } from "./+types/landing.page";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sp = url.searchParams;

  return landingApi.getLandingData({
    partnerCategory: sp.get("partnerCategory") ?? undefined,
    eventFilters: {
      time: sp.get("time") ?? undefined,
      city: sp.get("city") ?? undefined,
      category: sp.get("category") ?? undefined,
      price: sp.get("price") ?? undefined,
    },
  });
}

export default function LandingPage({ loaderData }: Route.ComponentProps) {
  const { banners, partners, featuredEvents, upcomingEvents } = loaderData;
  
  const {
    partnerCategory,
    eventFilters,
    updateParam,
    resetEventFilters,
  } = useLandingFilters();

  return (
    <div className="flex flex-col pb-20 animate-in fade-in duration-700">
      {/* 1. Hero Section */}
      <section className="w-full pt-2 pb-4 md:pt-6 md:pb-12">
        <BannerCarousel slides={banners} />
      </section>

      {/* 2. Partner Section */}
      <section className="w-full py-4 md:py-16">
        <PartnerSection
          brands={partners}
          activeCategory={partnerCategory}
          onCategoryChange={(val) => updateParam("partnerCategory", val)}
        />
      </section>

      {/* 3. Featured Section — Self-contained Coverflow Layout */}
      <FeaturedEvents events={featuredEvents} />

      {/* 4. Upcoming Section */}
      <section className="w-full py-20">
        <UpcomingEvents
          events={upcomingEvents}
          filterValues={eventFilters}
          onFilterChange={updateParam}
          onReset={resetEventFilters}
        />
      </section>
    </div>
  );
}
