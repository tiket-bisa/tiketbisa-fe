/**
 * BrandDto — Raw shape returned by GET /brand → data.brands[]
 */
export interface BrandDto {
  id: string;
  created: number; // timestamp
  name: string;
  logoPath: string | null;
  bannerPath: string | null;
  description: string | null;
}
