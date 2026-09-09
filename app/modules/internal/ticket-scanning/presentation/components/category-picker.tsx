import { useMemo, useState } from "react";
import { Card, Select, Button } from "~/core/design-system/components";
import { useCategoryPicker, useEventCategories } from "../hooks/use-category-picker";

export interface SelectedCategory {
  eventId: string;
  eventName: string;
  categories: { id: string; name: string }[];
}

interface CategoryPickerProps {
  /** Restrict events to a single brand (partner/scanner). Omit for admin (all brands). */
  brandId?: string;
  selected: SelectedCategory | null;
  onChange: (selection: SelectedCategory | null) => void;
}

/** Select the categories accepted at this gate within one event. */
export function CategoryPicker({ brandId, selected, onChange }: CategoryPickerProps) {
  const { events, loading, error } = useCategoryPicker(brandId);
  const [eventId, setEventId] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Categories are fetched lazily for the selected event only (avoids one request per event).
  const { categories, loading: loadingCategories, error: categoryError } = useEventCategories(eventId || undefined);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId],
  );

  const eventOptions = useMemo(
    () =>
      events.map((e) => ({
        value: e.id,
        label: e.brandName ? `${e.name} (${e.brandName})` : e.name,
      })),
    [events],
  );

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.event_id === eventId && c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, eventId, search],
  );

  const handleConfirm = () => {
    const chosen = categories.filter((c) => c.event_id === eventId && categoryIds.includes(c.id));
    if (!selectedEvent || chosen.length === 0 || loadingCategories || categoryError) return;
    onChange({
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      categories: chosen.map(({ id, name }) => ({ id, name })),
    });
  };

  if (selected) {
    return (
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-text-tertiary text-xs uppercase tracking-wide">Kategori Aktif</p>
            <p className="text-text-primary font-semibold">
              {selected.eventName} — {selected.categories.map((c) => c.name).join(", ")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEventId(selected.eventId);
              setCategoryIds(selected.categories.map((c) => c.id));
              setSearch("");
              onChange(null);
            }}
          >
            Ganti Kategori
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <h3 className="text-text-primary font-semibold mb-3">Pilih Event &amp; Kategori Tiket</h3>
      <p className="text-text-tertiary text-sm mb-4">
        Scan hanya akan menerima tiket dari kategori yang dipilih di bawah ini.
      </p>

      {loading && <p className="text-text-tertiary text-sm">Memuat event...</p>}
      {error && <p className="text-destructive-text text-sm">Gagal memuat event: {error}</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Select
              label="Event"
              placeholder="Pilih event"
              options={eventOptions}
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setCategoryIds([]);
                setSearch("");
              }}
            />
          </div>
          <div className="flex-1">
            <fieldset disabled={!eventId || loadingCategories || !!categoryError}>
              <legend className="text-sm font-medium mb-2">Kategori Tiket</legend>
              <input aria-label="Cari kategori" placeholder="Cari kategori" value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border-default p-2 mb-2" />
              <div className="max-h-56 overflow-y-auto space-y-2">
                {!loadingCategories && categoryOptions.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 p-2 cursor-pointer">
                    <input type="checkbox" checked={categoryIds.includes(category.id)}
                      onChange={(e) => setCategoryIds((ids) => e.target.checked
                        ? [...ids, category.id] : ids.filter((id) => id !== category.id))} />
                    {category.name}
                  </label>
                ))}
              </div>
            </fieldset>
            {loadingCategories && <p className="text-sm">Memuat kategori...</p>}
            {categoryError && <p role="alert">Gagal memuat kategori: {categoryError}</p>}
            {!loadingCategories && eventId && !categoryError && categoryOptions.length === 0 && (
              <p className="text-sm">Tidak ada kategori yang cocok.</p>
            )}
          </div>
          <Button variant="primary" onClick={handleConfirm} disabled={!eventId || categoryIds.length === 0 || loadingCategories || !!categoryError}>
            Terapkan
          </Button>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-text-tertiary text-sm mt-2">Belum ada event dengan kategori tiket.</p>
      )}
    </Card>
  );
}
