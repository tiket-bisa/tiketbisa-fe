import { useState, useMemo } from "react";
import { SearchInput, Pagination, Select, Card, Avatar, Badge } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";

const ITEMS_PER_PAGE = 8;

const sortOptions = [
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

/** Admin — Brand management (view all partner brands) */
export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch brands from real API
  const { data: brandsResponse, loading, error } = useApiQuery(
    async () => {
      const res = await brandApi.getList({ limit: 100, offset: 0 });
      if (!res.success || !res.data) return [];
      return (res.data.brands ?? []).map(mapBrandApiToFe);
    },
    [],
  );

  const allBrands = brandsResponse ?? [];

  const filtered = useMemo(() => {
    let result = allBrands.filter((b) =>
      b.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (sortBy === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }
    return result;
  }, [allBrands, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">Memuat data brand...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive-text">Gagal memuat data brand: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Semua Brand Partner</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Cari nama brand..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            onClear={() => { setSearch(""); setCurrentPage(1); }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} label="" placeholder="Urutkan" />
        </div>
      </div>

      {/* Brand Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paged.map((brand) => (
          <Card key={brand.id} hoverable padding="md">
            <div className="flex flex-col items-center gap-3 py-2">
              <Avatar src={brand.logo_url} fallback={brand.name} size="xl" />
              <span className="text-text-primary text-sm font-semibold text-center">{brand.name}</span>
              {brand.description && (
                <span className="text-text-tertiary text-xs text-center">{brand.description}</span>
              )}
              <div className="w-full border-t border-border-subtle pt-3 mt-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-tertiary">ID</span>
                  <span className="text-text-primary font-mono text-[10px]">{brand.id}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {paged.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
          <p className="text-lg">Tidak ada brand ditemukan</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
