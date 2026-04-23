import type { SelectOption } from "~/core/design-system/components";
import type { FilterBarFilter } from "~/shared/components";

//  Time Filter  //
export const TIME_FILTER_OPTIONS: SelectOption[] = [
  { value: "today", label: "Hari ini" },
  { value: "this_week", label: "Minggu ini" },
  { value: "this_month", label: "Bulan ini" },
];

//  City Filter  //
export const CITY_FILTER_OPTIONS: SelectOption[] = [
  { value: "jakarta", label: "Jakarta" },
  { value: "bandung", label: "Bandung" },
  { value: "surabaya", label: "Surabaya" },
  { value: "yogyakarta", label: "Yogyakarta" },
  { value: "semarang", label: "Semarang" },
  { value: "bali", label: "Bali" },
];

//  Category Filter  //
export const CATEGORY_FILTER_OPTIONS: SelectOption[] = [
  { value: "sepak_bola", label: "Sepak Bola" },
  { value: "musik", label: "Musik" },
  { value: "lari", label: "Lari" },
];

//  Price Filter  //
export const PRICE_FILTER_OPTIONS: SelectOption[] = [
  { value: "0-50000", label: "0 – 50.000" },
  { value: "50000-100000", label: "50.000 – 100.000" },
  { value: "100000-plus", label: "100.000+" },
];

//  Sort Options  //
export const SORT_OPTIONS: SelectOption[] = [
  { value: "date_asc", label: "Waktu Terdekat" },
  { value: "date_desc", label: "Waktu Terjauh" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

//  Combined filter config for FilterBar  //
export const EVENT_FILTERS: FilterBarFilter[] = [
  { key: "time", label: "Waktu", options: TIME_FILTER_OPTIONS },
  { key: "city", label: "Lokasi", options: CITY_FILTER_OPTIONS },
  { key: "category", label: "Kategori", options: CATEGORY_FILTER_OPTIONS },
  { key: "price", label: "Harga", options: PRICE_FILTER_OPTIONS },
];

/// Default page size matching wireframe "Size: 25" //
export const EVENT_PAGE_SIZE = 25;
