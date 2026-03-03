import { BrandCard } from "~/shared/components";
import type { Brand } from "../../domain/brand.entity";

interface BrandSelectionGridProps {
  brands: Brand[];
}

export function BrandSelectionGrid({ brands }: BrandSelectionGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} />
      ))}
    </div>
  );
}
