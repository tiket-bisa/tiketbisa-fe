import { useState, useMemo } from "react";
import { Card, Badge, SearchInput, Pagination, Tabs, Select } from "~/core/design-system/components";
import { allEvents } from "../infrastructure/event.mock";

const STATUS_MAP = {
  draft: { label: "Draft", variant: "default" as const },
  published: { label: "Terbit", variant: "success" as const },
  completed: { label: "Selesai", variant: "brand" as const },
  cancelled: { label: "Dibatalkan", variant: "destructive" as const },
};

const tabItems = [
  { value: "all", label: "Semua" },
  { value: "published", label: "Terbit" },
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Selesai" },
];

const ITEMS_PER_PAGE = 6;

/** Admin — Events across all brands */
export default function AdminEventsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Unique brand names from events
  const brandOptions = useMemo(() => {
    const brands = [...new Set(allEvents.map((e) => e.brand))].sort();
    return [
      { value: "all", label: "Semua Brand" },
      ...brands.map((b) => ({ value: b, label: b })),
    ];
  }, []);

  const filtered = useMemo(() => {
    return allEvents.filter((evt) => {
      const matchesSearch =
        evt.name.toLowerCase().includes(search.toLowerCase()) ||
        evt.description.toLowerCase().includes(search.toLowerCase()) ||
        evt.brand.toLowerCase().includes(search.toLowerCase());
      const matchesTab = tab === "all" || evt.status === tab;
      const matchesBrand = brandFilter === "all" || evt.brand === brandFilter;
      return matchesSearch && matchesTab && matchesBrand;
    });
  }, [search, tab, brandFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Semua Event</h1>

      <Tabs
        items={tabItems.map((t) => ({
          ...t,
          count: t.value === "all"
            ? allEvents.length
            : allEvents.filter((e) => e.status === t.value).length,
        }))}
        value={tab}
        onChange={(val) => { setTab(val); setCurrentPage(1); }}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Cari event atau brand..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            onClear={() => { setSearch(""); setCurrentPage(1); }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={brandOptions}
            value={brandFilter}
            onChange={(e) => { setBrandFilter(e.target.value); setCurrentPage(1); }}
            label=""
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paged.map((evt) => {
          const status = STATUS_MAP[evt.status ?? "draft"];
          return (
            <Card key={evt.id} hoverable padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-text-primary font-semibold truncate">{evt.name}</h3>
                  <p className="text-text-secondary text-sm mt-1">{evt.description}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">group</span>
                      {evt.brand}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {evt.date}
                    </span>
                    {evt.time && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {evt.time}
                      </span>
                    )}
                    {evt.location && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {evt.location}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {paged.length === 0 && (
        <div className="text-center py-12 text-text-tertiary">
          <p>Tidak ada event ditemukan</p>
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
