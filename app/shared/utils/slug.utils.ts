/**
 * Converts a text string into an SEO-friendly, URL-safe slug.
 * Example: "DE RED FC VS KENDAL TORNADO FC" -> "de-red-fc-vs-kendal-tornado-fc"
 * Example: "TiketBisa Festival 2026!" -> "tiketbisa-festival-2026"
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return "";

  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accent marks
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ""); // remove leading and trailing hyphens
}
