import { useState, useMemo } from "react";
import { SearchInput, Pagination, Select, Card, Avatar, Badge } from "~/core/design-system/components";
import { allBrands } from "../infrastructure/brand.mock";
import { allEvents } from "../../events/infrastructure/event.mock";
import { allTransactions } from "../../dashboard/infrastructure/transaction.mock";
import { formatIDR } from "~/core/utils";

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
  }, [search, sortBy, allBrands]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Compute stats per brand
  const brandStats = useMemo(() => {
    const stats: Record<string, { events: number; revenue: number; transactions: number }> = {};
    for (const brand of allBrands) {
      const brandEvents = allEvents.filter((e) => e.brand === brand.name);
      const brandTx = allTransactions.filter((t) =>
        brandEvents.some((e) => e.id === t.event_id),
      );
      stats[brand.id] = {
        events: brandEvents.length,
        revenue: brandTx.filter((t) => t.status === "paid").reduce((s, t) => s + t.total_price, 0),
        transactions: brandTx.length,
      };
    }
    return stats;
  }, [allBrands, allEvents, allTransactions]);

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
        {paged.map((brand) => {
          const stats = brandStats[brand.id];
          return (
            <Card key={brand.id} hoverable padding="md">
              <div className="flex flex-col items-center gap-3 py-2">
                <Avatar src={brand.logo_url} fallback={brand.name} size="xl" />
                <span className="text-text-primary text-sm font-semibold text-center">{brand.name}</span>
                {brand.description && (
                  <span className="text-text-tertiary text-xs text-center">{brand.description}</span>
                )}
                <div className="w-full border-t border-border-subtle pt-3 mt-1 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Event</span>
                    <Badge variant="brand">{stats.events}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Transaksi</span>
                    <span className="text-text-primary font-medium">{stats.transactions}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-tertiary">Revenue</span>
                    <span className="text-text-primary font-medium">{formatIDR(stats.revenue)}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
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
