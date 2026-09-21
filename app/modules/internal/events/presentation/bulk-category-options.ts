import { formatIDR } from "~/core/utils";

export interface BulkCategoryChoice {
  id: string;
  name: string;
  price: number;
  available: number;
}

export interface BulkCategoryOption {
  value: string;
  label: string;
  disabled: boolean;
}

/**
 * Options for the Tiket Bulk category picker.
 *
 * An exhausted category is still listed — it is useful to see that the category exists and is
 * simply out of stock — but it cannot be selected. Generation for it is refused anyway, by the
 * form and by the backend's inventory check, and discovering that only after filling in a
 * recipient, an email and a phone number is the thing this avoids.
 */
export function buildBulkCategoryOptions(categories: BulkCategoryChoice[]): BulkCategoryOption[] {
  return categories.map((category) => {
    const exhausted = category.available <= 0;
    return {
      value: category.id,
      label: exhausted
        ? `${category.name} - ${formatIDR(category.price)} - habis`
        : `${category.name} - ${formatIDR(category.price)} - sisa ${category.available}`,
      disabled: exhausted,
    };
  });
}
