import type { SelectedCategory } from "./components/category-picker";

const STORAGE_PREFIX = "tiketbisa_scan_category";

function storageKey(brandId?: string): string {
  return `${STORAGE_PREFIX}:${brandId || "all"}`;
}

function isSelectedCategory(value: unknown): value is SelectedCategory {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["eventId", "eventName", "categoryId", "categoryName"].every(
    (key) => typeof candidate[key] === "string" && candidate[key] !== "",
  );
}

export function readScanSelection(brandId?: string, storage?: Storage): SelectedCategory | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(brandId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSelectedCategory(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function persistScanSelection(
  selection: SelectedCategory | null,
  brandId?: string,
  storage?: Storage,
): void {
  if (!storage) return;
  const key = storageKey(brandId);
  if (!selection) {
    storage.removeItem(key);
    return;
  }
  storage.setItem(key, JSON.stringify(selection));
}
