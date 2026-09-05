const DOT_COM_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.com$/i;

/** Product rule: application email addresses must use a .com domain. */
export function isValidDotComEmail(value: string): boolean {
  return DOT_COM_EMAIL_PATTERN.test(value.trim());
}

export function isValidNik(value: string): boolean {
  return /^\d{16}$/.test(value.trim());
}
