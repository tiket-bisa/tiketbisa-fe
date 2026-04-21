import type { FilterBarFilter } from "~/shared/components/filter-bar/types";
import type { SelectOption } from "~/core/design-system/components";

export const BRAND_PAGE_SIZE = 12;

export const BRAND_FILTERS: FilterBarFilter[] = [
  {
    key: "category",
    label: "Kategori",
    options: [
      { value: "sepak-bola", label: "Sepak Bola" },
      { value: "lari", label: "Lari" },
      { value: "musik", label: "Musik" },
    ],
  },
  {
    key: "location",
    label: "Lokasi",
    options: [
      { value: "jakarta", label: "Jakarta" },
      { value: "bandung", label: "Bandung" },
      { value: "surabaya", label: "Surabaya" },
    ],
  },
];

export const SORT_OPTIONS: SelectOption[] = [
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];
