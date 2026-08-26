export type IndonesianPhoneValidation = {
  normalized: string | null;
  error: string | null;
};

export function validateIndonesianPhone(value: string): IndonesianPhoneValidation {
  const compact = value.trim().replace(/[\s-]/g, "");
  if (/^08\d*$/.test(compact) && (compact.length < 10 || compact.length > 13)) {
    return {
      normalized: null,
      error: "Nomor telepon format 08… harus terdiri dari 10–13 digit.",
    };
  }
  if (/^\+628\d*$/.test(compact)) {
    const digitCount = compact.slice(1).length;
    if (digitCount < 11 || digitCount > 14) {
      return {
        normalized: null,
        error: "Nomor telepon format +628… harus terdiri dari 11–14 digit.",
      };
    }
  }
  if (/^08[1-9][0-9]{7,10}$/.test(compact)) {
    return { normalized: `+62${compact.slice(1)}`, error: null };
  }
  if (/^\+628[1-9][0-9]{7,10}$/.test(compact)) {
    return { normalized: compact, error: null };
  }
  return { normalized: null, error: "Gunakan format 08… atau +628…." };
}

export function normalizeIndonesianPhone(value: string): string | null {
  return validateIndonesianPhone(value).normalized;
}
