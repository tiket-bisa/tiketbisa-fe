import { useSearchParams } from "react-router";
import { BRAND_FILTERS } from "../constants/brand.constants";

interface UpdateParamOptions {
  resetPage?: boolean;
  preventScrollReset?: boolean;
}

export function useBrand() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sortValue = searchParams.get("sort") ?? "";
  const filterValues: Record<string, string> = {
    category: searchParams.get("category") ?? "",
    location: searchParams.get("location") ?? "",
  };

  function updateParam(
    key: string,
    value: string,
    options: UpdateParamOptions = {},
  ) {
    const {
      resetPage = key !== "page",
      preventScrollReset = false,
    } = options;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }

        if (resetPage) {
          next.delete("page");
        }

        return next;
      },
      { preventScrollReset },
    );
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
