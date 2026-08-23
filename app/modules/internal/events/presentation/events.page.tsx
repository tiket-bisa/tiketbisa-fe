import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  Badge,
  SearchInput,
  Pagination,
  Tabs,
  Button,
  Input,
  Select,
} from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { toUserFacingError, useApiQuery } from "~/core/api";
import {
  internalEventApi,
  mapInternalEventToSummary,
  normalizeInternalEvent,
  type InternalEventApiData,
} from "~/core/api/services/internal-event.api";
import type { EventSummary } from "~/core/types";
import { fileToBase64 } from "~/modules/internal/common/presentation/image-source-input";
import { EventGalleryManager } from "~/modules/internal/common/presentation/event-gallery-manager";
import { SearchableCitySelect } from "./components/searchable-city-select";

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

const EMPTY_FORM_DATA = {
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
};

/** Partner — Event Management (filtered by partner's brand) */
export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingEvent, setEditingEvent] = useState<InternalEventApiData | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  const { data: eventsRaw, loading, error, refetch } = useApiQuery(
    async () => {
      if (!user?.brand_id) return [] as InternalEventApiData[];
      const res = await internalEventApi.getList({
        limit: 200,
        offset: 0,
        brandId: user.brand_id,
      });
      if (!res.success || !res.data) return [] as InternalEventApiData[];
      return (res.data.events ?? []).map(normalizeInternalEvent);
    },
    [user?.brand_id],
  );

  const eventsRawList = eventsRaw ?? [];
  const brandName = user?.brand_name ?? "Brand";
  const brandSlug = user?.brand_slug ?? "";

  const events = useMemo(() => {
    return eventsRawList.map((event) =>
      mapInternalEventToSummary(event, brandName, brandSlug),
    );
  }, [eventsRawList, brandName, brandSlug]);

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

  const resetForm = () => {
    setFormMode(null);
    setEditingEvent(null);
    setFormError(null);
    setFormSuccess(null);
    setFormData(EMPTY_FORM_DATA);
  };

  const startCreate = () => {
    resetForm();
    setFormMode("create");
  };

  const startEdit = (id: string) => {
    const event = eventsRawList.find((evt) => evt.id === id);
    if (!event) return;
    resetForm();
    setEditingEvent(event);
    setFormMode("edit");
    setFormData({
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

    if (!user?.brand_id) {
      setFormError("Brand partner belum terdaftar.");
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
        brandId: user.brand_id,
        name: formData.name.trim(),
        bannerPath: formMode === "create" ? null : undefined,
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

      await refetch();
      resetForm();
    } catch (err) {
      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
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
      setFormError(toUserFacingError(err, "Koneksi bermasalah."));
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const navigateToEventAction = (id: string, action: "tickets" | "complimentary" | "dashboard") => {
    setPendingAction(`${action}-${id}`);
    const suffix = action === "tickets" ? "tickets/new" : action === "complimentary" ? "complimentary/new" : "tickets";
    navigate(`/internal-tb/partner/events/${id}/${suffix}`);
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
        <h1 className="text-text-primary text-2xl font-bold">Event</h1>
        <Button variant="primary" onClick={startCreate}>
          Tambah Event
        </Button>
      </div>

      {formMode && (
        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-text-primary">
                {formMode === "edit" ? "Edit Event" : "Buat Event Baru"}
              </h2>
              <p className="text-sm text-text-tertiary">
                Event hanya akan terhubung ke brand kamu.
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

            <Input
              label="Nama Event"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
                label="Judul Lokasi / Venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
              />
              <Input
                label="Lokasi (link Google Maps)"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="https://maps.app.goo.gl/..."
                hint="Tempel link Google Maps, bukan alamat biasa."
              />
              <SearchableCitySelect
                value={formData.city}
                onChange={(city) => setFormData((prev) => ({ ...prev, city }))}
                required
                disabled={isSubmitting}
              />
            </div>

            <EventGalleryManager
              eventId={editingEvent?.id}
              uploadFile={uploadEventBanner}
              disabled={isSubmitting}
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
              <div className="mt-4 space-y-3 border-t border-border-subtle pt-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigateToEventAction(evt.id, "dashboard")}
                  isLoading={pendingAction === `dashboard-${evt.id}`}
                  className="flex w-full items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">query_stats</span>
                  Kelola Tiket & Penjualan
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
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
                    Tiket Complimentary
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
