import { useMemo, useState } from "react";
import { Card, Select, Button } from "~/core/design-system/components";
import { useCategoryPicker, type CategoryPickerEvent } from "../hooks/use-category-picker";

export interface SelectedCategory {
  eventId: string;
  eventName: string;
  categoryId: string;
  categoryName: string;
}

interface CategoryPickerProps {
  /** Restrict events to a single brand (partner/scanner). Omit for admin (all brands). */
  brandSlug?: string;
  selected: SelectedCategory | null;
  onChange: (selection: SelectedCategory | null) => void;
}

/** Event → ticket category picker used to scope scan/check-in to one category. */
export function CategoryPicker({ brandSlug, selected, onChange }: CategoryPickerProps) {
  const { events, loading, error } = useCategoryPicker(brandSlug);
  const [eventId, setEventId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const selectedEvent = useMemo<CategoryPickerEvent | undefined>(
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
    () => (selectedEvent?.categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    [selectedEvent],
  );

  const handleConfirm = () => {
    const category = selectedEvent?.categories.find((c) => c.id === categoryId);
    if (!selectedEvent || !category) return;
    onChange({
      eventId: selectedEvent.id,
      eventName: selectedEvent.name,
      categoryId: category.id,
      categoryName: category.name,
    });
  };

  if (selected) {
    return (
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-text-tertiary text-xs uppercase tracking-wide">Kategori Aktif</p>
            <p className="text-text-primary font-semibold">
              {selected.eventName} — {selected.categoryName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEventId("");
              setCategoryId("");
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
                setCategoryId("");
              }}
            />
          </div>
          <div className="flex-1">
            <Select
              label="Kategori Tiket"
              placeholder="Pilih kategori"
              options={categoryOptions}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!eventId}
            />
          </div>
          <Button variant="primary" onClick={handleConfirm} disabled={!eventId || !categoryId}>
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
