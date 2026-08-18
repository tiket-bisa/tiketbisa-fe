import type { PromoData, PromoType, PromoUpsertPayload } from "../infrastructure/promo.api";

export interface PromoFormState {
  id?: string;
  code: string;
  brandId: string;
  type: PromoType;
  value: string;
  maxDiscount: string;
  quota: string;
  usedCount: number;
  startsAt: string;
  endsAt: string;
}

export const EMPTY_PROMO_FORM: PromoFormState = {
  code: "",
  brandId: "",
  type: "PERCENT",
  value: "",
  maxDiscount: "",
  quota: "",
  usedCount: 0,
  startsAt: "",
  endsAt: "",
};

function toLocalDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function promoToForm(promo: PromoData): PromoFormState {
  return {
    id: promo.id,
    code: promo.code,
    brandId: promo.brandId ?? "",
    type: promo.type,
    value: String(promo.value),
    maxDiscount: promo.maxDiscount == null ? "" : String(promo.maxDiscount),
    quota: promo.quota == null ? "" : String(promo.quota),
    usedCount: Number(promo.usedCount ?? 0),
    startsAt: toLocalDateTime(promo.startsAt),
    endsAt: toLocalDateTime(promo.endsAt),
  };
}

export function validatePromoForm(form: PromoFormState): string | null {
  const value = Number(form.value);
  if (!form.code.trim()) return "Kode promo wajib diisi.";
  if (!Number.isFinite(value) || value <= 0) return "Nilai promo harus lebih besar dari 0.";
  if (form.type === "PERCENT" && value > 100) return "Nilai promo persen maksimal 100%.";
  if (form.maxDiscount && Number(form.maxDiscount) <= 0) return "Maksimum diskon harus lebih besar dari 0.";
  if (form.quota && (!Number.isInteger(Number(form.quota)) || Number(form.quota) <= 0)) {
    return "Kuota harus berupa bilangan bulat lebih besar dari 0.";
  }
  if (form.quota && Number(form.quota) < form.usedCount) {
    return `Kuota tidak boleh lebih kecil dari jumlah terpakai (${form.usedCount}).`;
  }
  if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
    return "Waktu selesai harus setelah waktu mulai.";
  }
  return null;
}

export function promoFormToPayload(form: PromoFormState): PromoUpsertPayload {
  return {
    code: form.code.trim().toUpperCase(),
    brandId: form.brandId || null,
    type: form.type,
    value: Number(form.value),
    maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
    quota: form.quota ? Number(form.quota) : null,
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
  };
}
