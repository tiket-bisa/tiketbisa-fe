export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl?: string;
  description?: string;
  category: string;
  subCategory?: string;
  location: string;
  accentColor?: string;
  joinedSince?: string;
  socialMedia?: { platform: string; url: string }[];
  /** "Biaya Layanan" charged per ticket at checkout (from brand.admin_fee). */
  adminFee: number;
  /** Single image containing all sponsor logos. */
  sponsorUrl?: string;
}
