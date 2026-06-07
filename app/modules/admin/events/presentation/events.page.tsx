import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  Badge,
  SearchInput,
  Pagination,
  Tabs,
  Select,
  Button,
  Input,
} from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import {
  internalEventApi,
  mapInternalEventToSummary,
  normalizeInternalEvent,
  type InternalEventApiData,
} from "~/core/api/services/internal-event.api";
import {
  internalBrandApi,
  normalizeInternalBrand,
  type InternalBrandApiData,
} from "~/core/api/services/internal-brand.api";
import type { EventSummary } from "~/core/types";
import { fileToBase64, ImageSourceInput } from "~/modules/internal/common/presentation/image-source-input";
import { EventGalleryManager } from "~/modules/internal/common/presentation/event-gallery-manager";

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
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingEvent, setEditingEvent] = useState<InternalEventApiData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brandId: "",
    name: "",
    startDate: "",
    endDate: "",
    venue: "",
    location: "",
    city: "",
    bannerPath: "",
    description: "",
    termAndCondition: "",
    status: "ONGOING",
    isPublished: false,
  });

  // Fetch brands for mapping brandId → brandName
  const { data: brandsRaw } = useApiQuery(
    async () => {
      const res = await internalBrandApi.getList({ limit: 200, offset: 0 });
      if (!res.success || !res.data) return [] as InternalBrandApiData[];
      return (res.data.brands ?? []).map(normalizeInternalBrand);
    },
    [],
  );

  // Fetch events from real API
  const { data: allEventsRaw, loading, error, refetch } = useApiQuery(
    async () => {
      const res = await internalEventApi.getList({ limit: 200, offset: 0 });
      if (!res.success || !res.data) return [] as InternalEventApiData[];
      return (res.data.events ?? []).map(normalizeInternalEvent);
    },
    [],
  );

  const eventsRaw = allEventsRaw ?? [];
  const brands = brandsRaw ?? [];

  const brandMap = useMemo(() => {
    return new Map(
      brands.map((brand) => [
        brand.id,
        { name: brand.name, slug: brand.name.toLowerCase().replace(/\s+/g, "-") },
      ]),
    );
  }, [brands]);

  const events = useMemo(() => {
    return eventsRaw.map((event) => {
      const brand = brandMap.get(event.brandId) ?? { name: "Unknown", slug: "" };
      return mapInternalEventToSummary(event, brand.name, brand.slug);
    });
  }, [eventsRaw, brandMap]);

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

  const brandOptionsForForm = useMemo(() => {
    return brands.map((brand) => ({ value: brand.id, label: brand.name }));
  }, [brands]);

  const resetForm = () => {
    setFormMode(null);
    setEditingEvent(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      brandId: "",
      name: "",
      startDate: "",
      endDate: "",
      venue: "",
      location: "",
      city: "",
      bannerPath: "",
      description: "",
      termAndCondition: "",
      status: "ONGOING",
      isPublished: false,
    });
  };

  const startCreate = () => {
    setFormMode("create");
    setEditingEvent(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData((prev) => ({
      ...prev,
      brandId: brandOptionsForForm[0]?.value ?? "",
    }));
  };

  const startEdit = (id: string) => {
    const event = eventsRaw.find((evt) => evt.id === id);
    if (!event) return;
    setEditingEvent(event);
    setFormMode("edit");
    setFormError(null);
    setFormSuccess(null);
    setFormData({
      brandId: event.brandId ?? "",
      name: event.name ?? "",
      startDate: toDateTimeLocal(event.startDate),
      endDate: toDateTimeLocal(event.endDate),
      venue: event.venue ?? "",
      location: event.location ?? "",
      city: event.city ?? "",
      bannerPath: event.bannerPath ?? "",
      description: event.description ?? "",
      termAndCondition: event.termAndCondition ?? "",
      status: event.status ?? "ONGOING",
      isPublished: Boolean(event.isPublished),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formData.brandId) {
      setFormError("Brand wajib dipilih.");
      return;
    }
    if (!formData.name.trim()) {
      setFormError("Nama event wajib diisi.");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      setFormError("Tanggal mulai dan selesai wajib diisi.");
      return;
    }
    if (!formData.venue.trim() || !formData.location.trim() || !formData.city.trim()) {
      setFormError("Venue, lokasi, dan kota wajib diisi.");
      return;
    }

    const startDate = toIsoString(formData.startDate);
    const endDate = toIsoString(formData.endDate);
    if (!startDate || !endDate) {
      setFormError("Format tanggal tidak valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        brandId: formData.brandId,
        name: formData.name.trim(),
        bannerPath: formData.bannerPath.trim() || null,
        startDate,
        endDate,
        description: formData.description.trim() || null,
        termAndCondition: formData.termAndCondition.trim() || null,
        venue: formData.venue.trim(),
        location: formData.location.trim(),
        city: formData.city.trim(),
        status: formData.status as InternalEventApiData["status"],
        isPublished: formData.isPublished,
      };

      const result = formMode === "edit" && editingEvent
        ? await internalEventApi.update(editingEvent.id, payload)
        : await internalEventApi.create(payload);

      if (!result.success) {
        setFormError(result.error || "Gagal menyimpan event.");
        return;
      }

      setFormSuccess(formMode === "edit" ? "Event berhasil diperbarui." : "Event berhasil dibuat.");
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Hapus event ini?");
    if (!confirmed) return;
    setPendingAction(`delete-${id}`);
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const result = await internalEventApi.delete(id);
      if (!result.success) {
        setFormError(result.error || "Gagal menghapus event.");
        return;
      }
      await refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const navigateToEventAction = (id: string, action: "tickets" | "complimentary") => {
    setPendingAction(`${action}-${id}`);
    const suffix = action === "tickets" ? "tickets/new" : "complimentary/new";
    navigate(`/internal-tb/admin/events/${id}/${suffix}`);
  };

  const uploadEventBanner = async (file: File) => {
    const bannerBase64 = await fileToBase64(file);
    const result = await internalEventApi.uploadBanner({
      bannerBase64,
      bannerMimeType: file.type || "application/octet-stream",
      bannerFileName: file.name || "event-banner",
    });
    if (!result.success || !result.data?.bannerUrl) {
      throw new Error(result.error || "Gagal mengunggah banner event.");
    }
    return result.data.bannerUrl;
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-text-primary text-2xl font-bold">Semua Event</h1>
        <Button variant="primary" onClick={startCreate}>Tambah Event</Button>
      </div>

      {formMode && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-text-primary">
                {formMode === "edit" ? "Edit Event" : "Buat Event Baru"}
              </h2>
              <p className="text-sm text-text-tertiary">
                Admin bisa membuat event untuk semua brand.
              </p>
            </div>

            {formError && (
              <div className="bg-red-50 text-destructive-text p-3 rounded-md text-sm">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="bg-green-50 text-success-text p-3 rounded-md text-sm">
                {formSuccess}
              </div>
            )}

            <Select
              label="Brand"
              name="brandId"
              value={formData.brandId}
              onChange={handleChange}
              options={brandOptionsForForm}
              placeholder="Pilih Brand"
            />

            <Input
              label="Nama Event"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Contoh: Jazz Night 2026"
              required
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Tanggal Mulai"
                name="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <Input
                label="Tanggal Selesai"
                name="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
              />
              <Input
                label="Lokasi"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
              <Input
                label="Kota"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>

            <ImageSourceInput
              label="Banner Event"
              value={formData.bannerPath}
              onChange={(value) => setFormData((prev) => ({ ...prev, bannerPath: value }))}
              uploadFile={uploadEventBanner}
              disabled={isSubmitting}
            />

            <EventGalleryManager
              eventId={editingEvent?.id}
              uploadFile={uploadEventBanner}
              disabled={isSubmitting}
              onCoverChange={(imageUrl) => setFormData((prev) => ({ ...prev, bannerPath: imageUrl }))}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: "ONGOING", label: "Berlangsung" },
                  { value: "ENDED", label: "Selesai" },
                ]}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mt-2">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border-default"
                />
                Publish event
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="event-description">
                Deskripsi
              </label>
              <textarea
                id="event-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Deskripsi singkat event"
                className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="event-terms">
                Syarat & Ketentuan
              </label>
              <textarea
                id="event-terms"
                name="termAndCondition"
                value={formData.termAndCondition}
                onChange={handleChange}
                placeholder="Pisahkan dengan baris baru"
                className="w-full rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                rows={4}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={resetForm}>
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                {formMode === "edit" ? "Simpan Perubahan" : "Buat Event"}
              </Button>
            </div>
          </form>
        </Card>
      )}

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
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigateToEventAction(evt.id, "tickets")}
                    isLoading={pendingAction === `tickets-${evt.id}`}
                    className="flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Tambah Tiket
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigateToEventAction(evt.id, "complimentary")}
                    isLoading={pendingAction === `complimentary-${evt.id}`}
                    className="flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">redeem</span>
                    Tiket Gratis
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(evt.id)}
                    disabled={isSubmitting}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(evt.id)}
                    disabled={isSubmitting}
                    isLoading={pendingAction === `delete-${evt.id}`}
                  >
                    Hapus
                  </Button>
                </div>
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

function toDateTimeLocal(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoString(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
