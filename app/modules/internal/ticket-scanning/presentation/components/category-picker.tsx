import { useMemo, useState } from "react";
import { Badge, Button, Card, SearchInput, Select } from "~/core/design-system/components";
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-text-tertiary text-xs uppercase tracking-wide">Kategori Aktif</p>
            <p className="mt-1 truncate text-text-primary font-semibold" title={selected.eventName}>
              {selected.eventName}
            </p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Kategori terpilih">
              {selected.categories.map((category) => (
                <Badge key={category.id} variant="brand">{category.name}</Badge>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
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
        <div className="space-y-5">
          <div className="w-full">
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

          {eventId && (
            <fieldset
              disabled={loadingCategories || !!categoryError}
              className="rounded-xl border border-border-default bg-surface-hover/30 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <legend className="text-sm font-semibold text-text-primary">Kategori Tiket</legend>
                <span className="rounded-full bg-brand-primary-subtle px-2.5 py-1 text-xs font-medium text-brand-primary">
                  {categoryIds.length} dipilih
                </span>
              </div>

              <SearchInput
                aria-label="Cari kategori"
                placeholder="Cari kategori tiket"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch("")}
                disabled={loadingCategories || !!categoryError}
              />

              <div className="mt-3 min-h-28 max-h-64 overflow-y-auto rounded-lg border border-border-default bg-surface-alt p-2">
                {loadingCategories && (
                  <div className="flex min-h-24 items-center justify-center text-sm text-text-tertiary">
                    Memuat kategori...
                  </div>
                )}
                {categoryError && (
                  <div role="alert" className="flex min-h-24 items-center justify-center text-sm text-destructive-text">
                    Gagal memuat kategori: {categoryError}
                  </div>
                )}
                {!loadingCategories && !categoryError && categoryOptions.length === 0 && (
                  <div className="flex min-h-24 items-center justify-center text-center text-sm text-text-tertiary">
                    Tidak ada kategori yang cocok.
                  </div>
                )}
                {!loadingCategories && !categoryError && categoryOptions.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {categoryOptions.map((category) => {
                      const checked = categoryIds.includes(category.id);
                      return (
                        <label
                          key={category.id}
                          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            checked
                              ? "border-brand-primary bg-brand-primary-subtle text-text-primary"
                              : "border-border-default bg-surface-alt text-text-secondary hover:bg-surface-hover"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setCategoryIds((ids) => e.target.checked
                              ? [...ids, category.id]
                              : ids.filter((id) => id !== category.id))}
                            className="h-4 w-4 shrink-0 accent-brand-primary"
                          />
                          <span className="min-w-0 break-words font-medium">{category.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-text-tertiary">
                  Pilih semua kategori yang dilayani pada gate ini.
                </p>
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={handleConfirm}
                  disabled={categoryIds.length === 0 || loadingCategories || !!categoryError}
                >
                  Terapkan
                </Button>
              </div>
            </fieldset>
          )}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-text-tertiary text-sm mt-2">Belum ada event dengan kategori tiket.</p>
      )}
    </Card>
  );
}
