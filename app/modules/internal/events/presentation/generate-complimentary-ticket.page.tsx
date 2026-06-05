import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Card, Select } from "~/core/design-system/components";
import { ticketCategoryApi, mapTicketCategoryToFe } from "~/core/api/services/ticket-category.api";
import { transactionApi } from "~/core/api/services/transaction.api";
import { internalEventApi, normalizeInternalEvent } from "~/core/api/services/internal-event.api";
import { useApiQuery } from "~/core/api";
import { useAuth } from "~/core/auth";
import { formatIDR } from "~/core/utils";

export default function GenerateComplimentaryTicketPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    categoryId: "",
    quantity: "1",
    codeType: "QR_CODE" as "QR_CODE" | "BARCODE",
    isGenerateCodeOnly: false,
  });

  const { data: event } = useApiQuery(
    async () => {
      if (!eventId) return null;
      const res = await internalEventApi.getById(eventId);
      return res.success && res.data ? normalizeInternalEvent(res.data) : null;
    },
    [eventId],
  );

  const { data: categoriesRaw, loading: loadingCategories } = useApiQuery(
    async () => {
      if (!eventId) return [];
      const res = await ticketCategoryApi.getByEvent(eventId);
      return res.success && res.data ? res.data : [];
    },
    [eventId],
  );

  const categories = useMemo(
    () => (categoriesRaw ?? []).map(mapTicketCategoryToFe),
    [categoriesRaw],
  );

  const categoryOptions = useMemo(
    () => categories.map((category) => ({
      value: category.id,
      label: `${category.name} - ${formatIDR(category.price)} - sisa ${category.available}`,
    })),
    [categories],
  );

  const fallbackPath = user?.role === "admin" ? "/internal-tb/admin/events" : "/internal-tb/partner/events";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    const quantity = Number(formData.quantity);
    if (!formData.categoryId) {
      setErrorMsg("Pilih kategori tiket terlebih dahulu.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setErrorMsg("Jumlah tiket minimal 1.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await transactionApi.manualGenerateTickets({
        eventId,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),
        paymentMethod: "COMPLIMENTARY",
        codeType: formData.codeType,
        isGenerateCodeOnly: formData.isGenerateCodeOnly,
        tickets: [{ categoryId: formData.categoryId, quantity }],
      });

      if (res.success) {
        setSuccessMsg("Tiket gratis berhasil dibuat dan dikirim jika template email aktif.");
        setFormData((prev) => ({
          ...prev,
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          quantity: "1",
          isGenerateCodeOnly: false,
        }));
      } else {
        setErrorMsg(res.error || "Gagal membuat tiket gratis.");
      }
    } catch {
      setErrorMsg("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(fallbackPath)}
          className="text-text-secondary hover:text-text-primary"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined text-xl leading-none">arrow_back</span>
        </button>
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Generate Tiket Gratis</h1>
          <p className="text-text-tertiary text-sm mt-1">{event?.name ?? "Event"}</p>
        </div>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="bg-red-50 text-destructive-text p-3 rounded-md text-sm">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-success-text p-3 rounded-md text-sm">
              {successMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="customerName">
              Nama Penerima <span className="text-destructive-text">*</span>
            </label>
            <input
              required
              id="customerName"
              name="customerName"
              type="text"
              className="w-full rounded-md border border-gray-300 p-2"
              value={formData.customerName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="customerEmail">
                Email <span className="text-destructive-text">*</span>
              </label>
              <input
                required
                id="customerEmail"
                name="customerEmail"
                type="email"
                className="w-full rounded-md border border-gray-300 p-2"
                value={formData.customerEmail}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="customerPhone">
                Nomor HP <span className="text-destructive-text">*</span>
              </label>
              <input
                required
                id="customerPhone"
                name="customerPhone"
                type="tel"
                className="w-full rounded-md border border-gray-300 p-2"
                value={formData.customerPhone}
                onChange={handleChange}
              />
            </div>
          </div>

          <Select
            label="Kategori Tiket"
            value={formData.categoryId}
            onChange={handleChange}
            options={[
              { value: "", label: loadingCategories ? "Memuat kategori..." : "Pilih kategori" },
              ...categoryOptions,
            ]}
            name="categoryId"
            disabled={loadingCategories}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="quantity">
                Jumlah Tiket <span className="text-destructive-text">*</span>
              </label>
              <input
                required
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                className="w-full rounded-md border border-gray-300 p-2"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>
            <Select
              label="Kode Scan"
              value={formData.codeType}
              onChange={handleChange}
              options={[
                { value: "QR_CODE", label: "QR Code" },
                { value: "BARCODE", label: "Barcode" },
              ]}
              name="codeType"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="isGenerateCodeOnly"
              checked={formData.isGenerateCodeOnly}
              onChange={handleChange}
              className="mt-1"
            />
            <span>Generate kode saja tanpa PDF tiket lengkap</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(fallbackPath)}>
              Kembali
            </Button>
            <Button type="submit" isLoading={loading} disabled={loadingCategories}>
              Generate Gratis
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
