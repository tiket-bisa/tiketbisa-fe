import { useState } from "react";
import { Button, Input, Select } from "~/core/design-system/components";
import { fileToBase64, ImageSourceInput } from "~/modules/internal/common/presentation/image-source-input";
import {
  internalEventApi,
  type EventTicketCategorySummary,
  type WristbandCategoryInput,
  type WristbandStatusFilter,
} from "~/core/api/services/internal-event.api";

const statusFilterOptions: { value: WristbandStatusFilter; label: string }[] = [
  { value: "ISSUED", label: "Issued" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "ALL_TICKET", label: "Semua Tiket" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CategoryFormState = {
  categoryId: string;
  categoryName: string;
  color: string;
  categoryNameOverride: string;
  gate: string;
};

type GenerateWristbandModalProps = {
  eventId: string;
  eventName: string;
  categories: EventTicketCategorySummary[];
  onClose: () => void;
};

const DEFAULT_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

export function GenerateWristbandModal({ eventId, eventName, categories, onClose }: GenerateWristbandModalProps) {
  const [statusFilter, setStatusFilter] = useState<WristbandStatusFilter>("ISSUED");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [bannerBase64, setBannerBase64] = useState("");
  const [categoryForms, setCategoryForms] = useState<CategoryFormState[]>(() =>
    categories.map((category, index) => ({
      categoryId: category.id,
      categoryName: category.name,
      color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      categoryNameOverride: "",
      gate: "",
    })),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateCategoryForm = (categoryId: string, patch: Partial<CategoryFormState>) => {
    setCategoryForms((current) =>
      current.map((form) => (form.categoryId === categoryId ? { ...form, ...patch } : form)),
    );
  };

  const handleBannerUpload = async (file: File) => {
    const base64 = await fileToBase64(file);
    const dataUrl = `data:${file.type || "image/png"};base64,${base64}`;
    setBannerBase64(base64);
    return dataUrl;
  };

  const isEmailValid = EMAIL_PATTERN.test(recipientEmail.trim());

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!recipientEmail.trim() || !isEmailValid) {
      setError("Masukkan email penerima yang valid.");
      return;
    }
    if (!bannerBase64) {
      setError("Unggah banner gelang (PNG) terlebih dahulu.");
      return;
    }

    const payloadCategories: WristbandCategoryInput[] = categoryForms.map((form) => ({
      categoryId: form.categoryId,
      color: form.color,
      categoryNameOverride: form.categoryNameOverride.trim() || undefined,
      gate: form.gate.trim() || undefined,
    }));

    setIsSubmitting(true);
    try {
      const result = await internalEventApi.generateWristbands(eventId, {
        statusFilter,
        recipientEmail: recipientEmail.trim(),
        bannerBase64,
        categories: payloadCategories,
      });
      if (!result.success) {
        setError(result.error || "Gagal memproses permintaan gelang.");
        return;
      }
      setSuccess(`Gelang sedang diproses, akan dikirim ke ${recipientEmail.trim()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Koneksi bermasalah.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Generate Gelang</h3>
            <p className="text-sm text-text-tertiary">
              Buat gelang untuk peserta event berdasarkan status tiket.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-destructive-text">{error}</div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-success-text">{success}</div>
          )}

          <div>
            <label className="text-sm font-medium text-text-primary">Event</label>
            <p className="mt-1.5 rounded-lg border border-border-default bg-surface-alt px-3 py-2 text-sm text-text-secondary">
              {eventName}
            </p>
          </div>

          <Select
            label="Status Tiket"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as WristbandStatusFilter)}
            options={statusFilterOptions}
            disabled={isSubmitting}
          />

          <Input
            label="Email Penerima"
            type="email"
            required
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="nama@email.com"
            disabled={isSubmitting}
            error={recipientEmail.trim() && !isEmailValid ? "Format email tidak valid." : undefined}
          />

          <ImageSourceInput
            label="Banner Gelang (PNG)"
            value={bannerBase64 ? `data:image/png;base64,${bannerBase64}` : ""}
            onChange={() => undefined}
            uploadFile={handleBannerUpload}
            disabled={isSubmitting}
            hint="Upload banner PNG yang akan digunakan pada gelang."
          />

          {categoryForms.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-primary">Kategori Tiket</label>
              <div className="space-y-3">
                {categoryForms.map((form) => (
                  <div key={form.categoryId} className="rounded-lg border border-border-subtle p-3">
                    <p className="mb-2 text-sm font-medium text-text-primary">{form.categoryName}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-text-secondary">Warna</span>
                        <input
                          type="color"
                          value={form.color}
                          onChange={(event) => updateCategoryForm(form.categoryId, { color: event.target.value })}
                          disabled={isSubmitting}
                          className="h-10 w-full cursor-pointer rounded-lg border border-border-default bg-surface-alt disabled:cursor-not-allowed"
                        />
                      </label>
                      <Input
                        label="Nama Kategori"
                        value={form.categoryNameOverride}
                        onChange={(event) =>
                          updateCategoryForm(form.categoryId, { categoryNameOverride: event.target.value })
                        }
                        placeholder={form.categoryName}
                        disabled={isSubmitting}
                      />
                      <Input
                        label="Gate"
                        value={form.gate}
                        onChange={(event) => updateCategoryForm(form.categoryId, { gate: event.target.value })}
                        placeholder="Contoh: Gate A"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} isLoading={isSubmitting}>
            Generate Gelang
          </Button>
        </div>
      </div>
    </div>
  );
}
