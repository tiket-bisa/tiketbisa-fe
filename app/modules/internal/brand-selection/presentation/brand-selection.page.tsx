import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { SearchInput, Pagination, Select } from "~/core/design-system/components";
import { Card, Avatar } from "~/core/design-system/components";
import { mockBrands } from "../infrastructure/brand.mock";

const ITEMS_PER_PAGE = 8;

const sortOptions = [
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

/** Internal — Brand Selection (Pilih Brand) */
export default function BrandSelectionPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    let result = mockBrands.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [search, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectBrand = (brandSlug: string) => {
    // Navigate to the partner dashboard for this brand
    // Store selected brand in session
    sessionStorage.setItem("tiketbisa_selected_brand", brandSlug);
    navigate("/partner");
  };

  return (
    <div className="min-h-screen bg-surface-primary" data-theme="light">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-text-primary text-2xl font-bold mb-2">Pilih Brand</h1>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <div className="flex-1">
            <SearchInput
              placeholder="Cari nama brand"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearch("");
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label=""
              placeholder="Urutkan"
            />
          </div>
        </div>

        {/* Brand Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {paged.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleSelectBrand(brand.slug)}
              className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-xl cursor-pointer"
            >
              <Card hoverable padding="md">
                <div className="flex flex-col items-center gap-3 py-2">
                  <Avatar
                    src={brand.logo_url}
                    fallback={brand.name}
                    size="xl"
                  />
                  <span className="text-text-primary text-sm font-medium text-center truncate w-full">
                    {brand.name}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {paged.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
            <p className="text-lg">Tidak ada brand ditemukan</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Page info */}
        <p className="mt-4 text-center text-xs text-text-tertiary">
          Size: {filtered.length}. Page {currentPage}
        </p>
      </div>
    </div>
  );
}
