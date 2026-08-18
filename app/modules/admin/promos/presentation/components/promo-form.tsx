import { Button, Card, Input, Select } from "~/core/design-system/components";
import type { PromoFormState } from "../../domain/promo-form";

interface PromoFormProps {
  form: PromoFormState;
  brandOptions: { value: string; label: string }[];
  feedback: { type: "success" | "error"; message: string } | null;
  isSaving: boolean;
  formRef: React.RefObject<HTMLDivElement | null>;
  onChange: (field: keyof PromoFormState, value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
}

export function PromoForm({ form, brandOptions, feedback, isSaving, formRef, onChange, onSubmit, onCancel }: PromoFormProps) {
  return (
    <Card padding="lg">
      <div ref={formRef} tabIndex={-1}>
        <form className="space-y-4" onSubmit={onSubmit}>
          <h2 className="font-semibold text-text-primary">{form.id ? "Edit Promo" : "Promo Baru"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Kode Promo" value={form.code} disabled={isSaving} onChange={(e) => onChange("code", e.target.value.toUpperCase())} />
            <Select label="Brand" options={brandOptions} value={form.brandId} disabled={isSaving} onChange={(e) => onChange("brandId", e.target.value)} />
            <Select label="Tipe" options={[{ value: "PERCENT", label: "Persen" }, { value: "FLAT", label: "Nominal" }]} value={form.type} disabled={isSaving} onChange={(e) => onChange("type", e.target.value)} />
            <Input label={form.type === "PERCENT" ? "Nilai (%)" : "Nilai (Rp)"} type="number" min="1" max={form.type === "PERCENT" ? "100" : undefined} value={form.value} disabled={isSaving} onChange={(e) => onChange("value", e.target.value)} />
            <Input label="Maksimum Diskon (opsional)" type="number" min="1" value={form.maxDiscount} disabled={isSaving} onChange={(e) => onChange("maxDiscount", e.target.value)} />
            <Input label="Kuota (opsional)" type="number" min={Math.max(1, form.usedCount)} step="1" value={form.quota} disabled={isSaving} onChange={(e) => onChange("quota", e.target.value)} />
            <Input label="Mulai (opsional)" type="datetime-local" value={form.startsAt} disabled={isSaving} onChange={(e) => onChange("startsAt", e.target.value)} />
            <Input label="Selesai (opsional)" type="datetime-local" value={form.endsAt} disabled={isSaving} onChange={(e) => onChange("endsAt", e.target.value)} />
          </div>
          {feedback && <p role={feedback.type === "error" ? "alert" : "status"} className={`text-sm ${feedback.type === "error" ? "text-destructive-text" : "text-success-text"}`}>{feedback.message}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" isLoading={isSaving} disabled={isSaving}>{form.id ? "Simpan Perubahan" : "Buat Promo"}</Button>
            {form.id && <Button type="button" variant="ghost" disabled={isSaving} onClick={onCancel}>Batal</Button>}
          </div>
        </form>
      </div>
    </Card>
  );
}
