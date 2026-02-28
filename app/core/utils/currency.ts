/**
 * Formats a numeric value into Indonesian Rupiah (IDR) currency format.
 * @param amount - The numeric value to format.
 * @returns Formatted string (e.g., "Rp 50.000" or "Gratis").
 */
export function formatIDR(amount: number): string {
  if (amount === 0) return "Gratis";
  
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
