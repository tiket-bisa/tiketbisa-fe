export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  bannerUrl?: string;
  description?: string;
  category: string;
  location: string;
  accentColor?: string;
  joinedSince?: string;
  socialMedia?: { platform: string; url: string }[];
}
