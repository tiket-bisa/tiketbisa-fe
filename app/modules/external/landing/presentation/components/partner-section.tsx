import { Link } from "react-router";
import { BrandCard, SectionHeader } from "~/shared/components";
import { CategoryChip } from "~/core/design-system/components";
import type { Brand } from "../../../brand/domain/brand.entity";

interface PartnerSectionProps {
  brands: Brand[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CATEGORIES = [
  { label: "Semua", value: "" },
  { label: "Sepak Bola", value: "sepak-bola" },
  { label: "Musik", value: "musik" },
  { label: "Lari", value: "lari" },
];

export function PartnerSection({
  brands,
  activeCategory,
  onCategoryChange,
}: PartnerSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        title="Partner Resmi"
        subtitle="Dukung tim dan artis favoritmu secara langsung"
        action={
          <Link
            to="/brand"
            className="text-sm font-semibold text-brand-primary hover:underline"
          >
            Lihat semua &rarr;
          </Link>
        }
        className="mb-4"
      />

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.label}
            label={cat.label}
            selected={activeCategory === cat.value}
            onClick={() => onCategoryChange(cat.value)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {brands.map((brand) => (
          <Link key={brand.id} to={`/brand/${brand.slug}`}>
            <BrandCard
              brand={{
                id: brand.id,
                name: brand.name,
                logoUrl: brand.logoUrl,
              }}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
