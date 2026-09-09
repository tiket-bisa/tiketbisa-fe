import type { SelectedCategory } from "./components/category-picker";

const STORAGE_PREFIX = "tiketbisa_scan_category";

function storageKey(brandId?: string): string {
  return `${STORAGE_PREFIX}:${brandId || "all"}`;
}

function isSelectedCategory(value: unknown): value is SelectedCategory {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return ["eventId", "eventName"].every(
    (key) => typeof candidate[key] === "string" && candidate[key] !== "",
  ) && Array.isArray(candidate.categories) && candidate.categories.length > 0
    && candidate.categories.every((category: unknown) => {
      if (!category || typeof category !== "object") return false;
      const item = category as Record<string, unknown>;
      return typeof item.id === "string" && item.id.trim() !== ""
        && typeof item.name === "string" && item.name.trim() !== "";
    });
}

export function readScanSelection(brandId?: string, storage?: Storage): SelectedCategory | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(storageKey(brandId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && !parsed.categories && typeof parsed.categoryId === "string"
      && typeof parsed.categoryName === "string") {
      parsed.categories = [{ id: parsed.categoryId, name: parsed.categoryName }];
      delete parsed.categoryId;
      delete parsed.categoryName;
    }
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
