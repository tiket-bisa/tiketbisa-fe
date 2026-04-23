import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Card, Badge, SearchInput, Pagination, Tabs } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
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

/** Partner — Event Management (filtered by partner's brand) */
export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Resolve brand ID from user's brand_slug by fetching brand list
  const { data: brandInfo } = useApiQuery(
    async () => {
      const res = await brandApi.getList({ limit: 100, offset: 0 });
      if (!res.success || !res.data) return null;
      for (const b of res.data.brands ?? []) {
        const fe = mapBrandApiToFe(b);
        if (fe.slug === user?.brand_slug) {
          return { id: b.id, name: fe.name, slug: fe.slug };
        }
      }
      return null;
    },
    [user?.brand_slug],
  );

  // Fetch events filtered by brandId
  const { data: brandEvents, loading, error } = useApiQuery(
    async () => {
      if (!brandInfo) return [] as EventSummary[];
      const res = await eventApi.getList({
        limit: 100,
        offset: 0,
        brandId: brandInfo.id,
      });
      if (!res.success || !res.data) return [] as EventSummary[];
      return (res.data.events ?? []).map((e) =>
        mapEventApiToFe(e, brandInfo.name, brandInfo.slug),
      );
    },
    [brandInfo],
  );

  const events = brandEvents ?? [];

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: events.length,
      published: 0,
      draft: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const evt of events) {
      const status = evt.status ?? "draft";
      counts[status] = (counts[status] ?? 0) + 1;
    }

    return counts;
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((evt) => {
      const matchesSearch =
        evt.name.toLowerCase().includes(search.toLowerCase()) ||
        evt.description.toLowerCase().includes(search.toLowerCase());
      const matchesTab = tab === "all" || evt.status === tab;
      return matchesSearch && matchesTab;
    });
  }, [events, search, tab]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
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
      <h1 className="text-text-primary text-2xl font-bold">Event</h1>

      {/* Tabs */}
      <Tabs
        items={tabItems.map((t) => ({
          ...t,
          count: tabCounts[t.value] ?? 0,
        }))}
        value={tab}
        onChange={(val) => {
          setTab(val);
          setCurrentPage(1);
        }}
      />

      {/* Search */}
      <SearchInput
        placeholder="Cari event..."
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

      {/* Event List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paged.map((evt) => {
          const status = STATUS_MAP[evt.status ?? "draft"];
          return (
            <Card key={evt.id} hoverable padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-text-primary font-semibold truncate">
                    {evt.name}
                  </h3>
                  <p className="text-text-secondary text-sm mt-1">
                    {evt.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-text-tertiary">
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
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/internal/partner/events/${evt.id}/tickets/new`)}
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

      {/* Empty */}
      {paged.length === 0 && (
        <div className="text-center py-12 text-text-tertiary">
          <p>Tidak ada event ditemukan</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
