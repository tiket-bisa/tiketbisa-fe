import { useNavigate } from "react-router";
import { BrandCard } from "~/shared/components";
import type { Brand } from "../../domain/brand.entity";

interface BrandGridProps {
  brands: Brand[];
}

export function BrandGrid({ brands }: BrandGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {brands.map((brand) => (
        <BrandCard
          key={brand.id}
          brand={brand}
          onClick={() => navigate(`/brand/${brand.slug}`)}
        />
      ))}
    </div>
  );
}
