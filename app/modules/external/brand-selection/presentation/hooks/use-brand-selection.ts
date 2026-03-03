import { useSearchParams } from "react-router";
import { BRAND_FILTERS } from "../constants";

export function useBrandSelection() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sortValue = searchParams.get("sort") ?? "";
  const filterValues: Record<string, string> = {
    category: searchParams.get("category") ?? "",
    location: searchParams.get("location") ?? "",
  };

  function updateParam(key: string, value: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      next.delete("page");
      return next;
    });
  }

  function resetFilters() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      BRAND_FILTERS.forEach((f) => next.delete(f.key));
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

  return {
    sortValue,
    filterValues,
    updateParam,
    resetFilters,
    handlePageChange,
  };
}
