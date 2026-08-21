import type { InternalBrandApiData } from "~/core/api/services/internal-brand.api";

export interface BrandMutationFormData {
  name: string;
  logoPath: string;
  bannerPath: string;
  description: string;
  category: string;
  subCategory: string;
  sponsorPath: string;
  homeOnly: boolean;
  homeCity: string;
}

export function buildBrandMutationPayload(
  formData: BrandMutationFormData,
  adminFee: number,
): Partial<InternalBrandApiData> {
  const isFootball = formData.category.trim() === "sepak_bola";
  return {
    name: formData.name.trim(),
    logoPath: formData.logoPath.trim() || null,
    bannerPath: formData.bannerPath.trim() || null,
    description: formData.description.trim() || null,
    adminFee: Math.round(adminFee),
    category: formData.category.trim() || null,
    subCategory: formData.subCategory.trim() || null,
    sponsorPath: formData.sponsorPath.trim() || null,
    homeOnly: isFootball ? formData.homeOnly : false,
    homeCity: isFootball && formData.homeOnly ? formData.homeCity.trim() || null : null,
  };
}
