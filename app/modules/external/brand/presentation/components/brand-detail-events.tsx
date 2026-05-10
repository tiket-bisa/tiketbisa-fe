import { Tabs, Select, Pagination } from "~/core/design-system/components";
import { EventCard, EmptyState } from "~/shared/components";
import type { Event as DomainEvent } from "../../../event/domain/event.entity";

interface BrandDetailEventsProps {
  events: DomainEvent[];
  activeTab: string;
  onTabChange: (val: string) => void;
  sortValue: string;
  onSortChange: (val: string) => void;
  currentPage: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: string) => void;
}

export function BrandDetailEvents({
  events,
  activeTab,
  onTabChange,
  sortValue,
  onSortChange,
  currentPage,
  totalPages,
  limit,
  onPageChange,
  onLimitChange,
}: BrandDetailEventsProps) {
  const tabItems = [
    { label: "Event Aktif", value: "aktif" },
    { label: "Event Lalu", value: "lalu" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Tabs and Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4 border-b border-border-subtle pb-2">
        <Tabs items={tabItems} value={activeTab} onChange={onTabChange} />
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-text-tertiary whitespace-nowrap hidden sm:block">
            Urutkan:
          </label>
          <Select
            options={[
              { value: "date_asc", label: "Waktu Terdekat" },
              { value: "date_desc", label: "Waktu Terjauh" },
              { value: "name_asc", label: "Nama A-Z" },
              { value: "name_desc", label: "Nama Z-A" },
            ]}
            value={sortValue}
            onChange={(e) => onSortChange(e.currentTarget.value)}
            placeholder="Pilih Urutan"
            className="w-full sm:w-auto min-w-[180px]"
          />
        </div>
      </div>

      {/* Events Grid */}
      {events.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={{
                  id: event.id,
                  title: event.name,
                  imageUrl: event.imageUrl,
                  date: event.date,
                  location: event.location,
                  tickets: event.tickets,
                  minPrice: event.minPrice,
                  brandName: event.brand,
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-text-tertiary whitespace-nowrap hidden sm:block">
                Show:
              </label>
              <Select
                options={[
                  { value: "12", label: "12" },
                  { value: "24", label: "24" },
                  { value: "48", label: "48" },
                ]}
                value={String(limit)}
                onChange={(e) => onLimitChange(e.currentTarget.value)}
                placeholder="Show"
                className="w-24"
              />
            </div>
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </div>
        </>
      ) : (
        <div className="py-12">
          <EmptyState
            title="Tidak ada event ditemukan"
            description="Brand ini belum memiliki event untuk kategori yang dipilih."
          />
        </div>
      )}
    </div>
  );
}
