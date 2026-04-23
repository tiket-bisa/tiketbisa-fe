import { useSearchParams } from "react-router";
import { EVENT_FILTERS } from "../../../event/presentation/constants";

export function useLandingFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const partnerCategory = searchParams.get("partnerCategory") ?? "";
  const eventFilters = {
    time: searchParams.get("time") ?? "",
    city: searchParams.get("city") ?? "",
    category: searchParams.get("category") ?? "",
    price: searchParams.get("price") ?? "",
  };

  const updateParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const resetEventFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      EVENT_FILTERS.forEach((f) => next.delete(f.key));
      return next;
    });
  };

  return {
    partnerCategory,
    eventFilters,
    updateParam,
    resetEventFilters,
  };
}
