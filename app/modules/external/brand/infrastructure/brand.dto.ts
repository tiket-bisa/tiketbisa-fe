/**
 * BrandDto — Raw shape returned by GET /brand → data.brands[]
 */
export interface BrandDto {
  id: string;
  created: number; // timestamp
  name: string;
  logoPath: string | null;
  logo_path?: string | null;
  bannerPath: string | null;
  banner_path?: string | null;
  description: string | null;
  adminFee?: number | string | null;
  admin_fee?: number | string | null;
  category?: string | null;
  subCategory?: string | null;
  sub_category?: string | null;
  sponsorPath?: string | null;
  sponsor_path?: string | null;
}
