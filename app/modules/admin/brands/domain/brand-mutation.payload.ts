import type { InternalBrandApiData } from "~/core/api/services/internal-brand.api";

export interface BrandMutationFormData {
  name: string;
  logoPath: string;
  bannerPath: string;
  description: string;
  category: string;
  subCategory: string;
  sponsorPath: string;
}

export function buildBrandMutationPayload(
  formData: BrandMutationFormData,
  adminFee: number,
): Partial<InternalBrandApiData> {
  return {
    name: formData.name.trim(),
    logoPath: formData.logoPath.trim() || null,
    bannerPath: formData.bannerPath.trim() || null,
    description: formData.description.trim() || null,
    adminFee: Math.round(adminFee),
    category: formData.category.trim() || null,
    subCategory: formData.subCategory.trim() || null,
    sponsorPath: formData.sponsorPath.trim() || null,
  };
}
