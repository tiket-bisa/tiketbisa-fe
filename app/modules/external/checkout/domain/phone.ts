export function normalizeIndonesianPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s-]/g, "");
  if (/^08[1-9][0-9]{7,10}$/.test(compact)) {
    return `+62${compact.slice(1)}`;
  }
  if (/^\+628[1-9][0-9]{7,10}$/.test(compact)) {
    return compact;
  }
  return null;
}
