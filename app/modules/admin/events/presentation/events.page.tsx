import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, Badge, SearchInput, Pagination, Tabs, Select, Button } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import { eventApi, mapEventApiToFe } from "~/core/api/services/event.api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import type { EventSummary } from "~/core/types";

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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch brands for mapping brandId → brandName
  const { data: brandsMap } = useApiQuery(
    async () => {
      const res = await brandApi.getList({ limit: 100, offset: 0 });
      if (!res.success || !res.data) return new Map<string, { name: string; slug: string }>();
      const map = new Map<string, { name: string; slug: string }>();
      for (const b of res.data.brands ?? []) {
        const fe = mapBrandApiToFe(b);
        map.set(b.id, { name: fe.name, slug: fe.slug });
      }
      return map;
    },
    [],
  );

  // Fetch events from real API
  const { data: allEvents, loading, error } = useApiQuery(
    async () => {
      const res = await eventApi.getList({ limit: 100, offset: 0 });
      if (!res.success || !res.data) return [] as EventSummary[];
      const bMap = brandsMap ?? new Map();
      return (res.data.events ?? []).map((e) => {
        const brand = bMap.get(e.brand_id) ?? { name: "Unknown", slug: "" };
        return mapEventApiToFe(e, brand.name, brand.slug);
      });
    },
    [brandsMap],
  );

  const events = allEvents ?? [];

  // Unique brand names from events
  const brandOptions = useMemo(() => {
    const brands = [...new Set(events.map((e) => e.brand))].sort();
    return [
      { value: "all", label: "Semua Brand" },
      ...brands.map((b) => ({ value: b, label: b })),
    ];
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        evt.name.toLowerCase().includes(search.toLowerCase()) ||
        evt.description.toLowerCase().includes(search.toLowerCase()) ||
        evt.brand.toLowerCase().includes(search.toLowerCase());
      const matchesTab = tab === "all" || evt.status === tab;
      const matchesBrand = brandFilter === "all" || evt.brand === brandFilter;
      return matchesSearch && matchesTab && matchesBrand;
    });
  }, [events, search, tab, brandFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">Memuat data event...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive-text">Gagal memuat data event: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Semua Event</h1>

      <Tabs
        items={tabItems.map((t) => ({
          ...t,
          count: t.value === "all"
            ? events.length
            : events.filter((e) => e.status === t.value).length,
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
              <div className="mt-4 flex justify-end border-t border-border-subtle pt-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate(`/internal-tb/admin/events/${evt.id}/tickets/new`)}
                  className="flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Tambah Tiket
                </Button>
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
