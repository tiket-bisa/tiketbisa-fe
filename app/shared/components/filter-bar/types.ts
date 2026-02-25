import type { SelectOption } from "~/core/design-system/components";

export interface FilterBarFilter {
  key: string;
  label: string;
  options: SelectOption[];
}
