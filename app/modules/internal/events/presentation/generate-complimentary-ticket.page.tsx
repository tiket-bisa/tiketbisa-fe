import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Card, Select } from "~/core/design-system/components";
import { ticketCategoryApi, mapTicketCategoryToFe } from "~/core/api/services/ticket-category.api";
import { transactionApi, type IssuedTicketDetail } from "~/core/api/services/transaction.api";
import { internalEventApi, normalizeInternalEvent } from "~/core/api/services/internal-event.api";
import { toUserFacingError, useApiQuery } from "~/core/api";
import { useAuth } from "~/core/auth";
import { formatIDR } from "~/core/utils";
import { normalizeIndonesianPhone } from "~/modules/external/checkout/domain/phone";

interface GeneratedTicketRow extends IssuedTicketDetail {
  categoryName: string;
}

export default function GenerateComplimentaryTicketPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedTickets, setGeneratedTickets] = useState<GeneratedTicketRow[]>([]);
  // Set (not a single id) so several tickets can be downloaded at once without one download's
  // spinner clearing another's — each button tracks its own loading state.
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [emailingIds, setEmailingIds] = useState<Set<string>>(new Set());
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    categoryId: "",
    quantity: "1",
    codeType: "QR_CODE" as "QR_CODE" | "BARCODE",
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
    const selectedCategory = categories.find((category) => category.id === formData.categoryId);
    if (selectedCategory && quantity > selectedCategory.available) {
      setErrorMsg(`Jumlah melebihi sisa stok kategori (${selectedCategory.available}).`);
      return;
    }
    const normalizedPhone = normalizeIndonesianPhone(formData.customerPhone);
    if (!normalizedPhone) {
      setErrorMsg("Nomor HP harus menggunakan format 08… atau +628…");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setGeneratedTickets([]);
    setDownloadError(null);

    try {
      const res = await transactionApi.manualGenerateTickets({
        eventId,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: normalizedPhone,
        paymentMethod: "COMPLIMENTARY",
        codeType: formData.codeType,
        tickets: [{ categoryId: formData.categoryId, quantity }],
      });

      if (res.success) {
        setSuccessMsg("Tiket complimentary berhasil dibuat dan dikirim jika template email aktif.");
        setFormData((prev) => ({
          ...prev,
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          quantity: "1",
        }));

        const transactionId = res.data?.id;
        if (transactionId) {
          const detailRes = await transactionApi.getDetail(transactionId);
          if (detailRes.success && detailRes.data) {
            const rows: GeneratedTicketRow[] = detailRes.data.ticketDetails.flatMap((detail) =>
              (detail.issuedTickets ?? []).map((ticket) => ({
                ...ticket,
                categoryName: detail.category?.name ?? "-",
              })),
            );
            setGeneratedTickets(rows);
          }
        }
      } else {
        setErrorMsg(res.error || "Gagal membuat tiket complimentary.");
      }
    } catch {
      setErrorMsg("Koneksi bermasalah.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (ticketId: string) => {
    setDownloadingIds((prev) => new Set(prev).add(ticketId));
    setDownloadError(null);
    try {
      const result = await transactionApi.downloadTicketPdf(ticketId);
      if (!result.success || !result.data) {
        setDownloadError(result.error || "Gagal mengunduh tiket.");
        return;
      }
      const objectUrl = URL.createObjectURL(result.data.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = result.data.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setDownloadError(toUserFacingError(err, "Gagal mengunduh tiket."));
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    }
  };

  // Re-send a single ticket to the original customer's email (recovery when the auto-send failed).
  const handleEmail = async (ticketId: string) => {
    setEmailingIds((prev) => new Set(prev).add(ticketId));
    setEmailFeedback(null);
    try {
      const res = await transactionApi.emailTicketPdf(ticketId, {
        deliveryMode: "ORIGINAL_CUSTOMER_EMAIL",
      });
      if (res.success) {
        setEmailFeedback({ type: "success", msg: "Tiket dikirim ke email pemesan." });
      } else {
        setEmailFeedback({ type: "error", msg: res.error || "Gagal mengirim email tiket." });
      }
    } catch (err) {
      setEmailFeedback({
        type: "error",
        msg: toUserFacingError(err, "Gagal mengirim email tiket."),
      });
    } finally {
      setEmailingIds((prev) => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
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
          <h1 className="text-text-primary text-2xl font-bold">Generate Tiket Complimentary</h1>
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

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(fallbackPath)}>
              Kembali
            </Button>
            <Button type="submit" isLoading={loading} disabled={loadingCategories}>
              Generate Complimentary
            </Button>
          </div>
        </form>
      </Card>

      {generatedTickets.length > 0 && (
        <Card padding="lg">
          <div className="space-y-3">
            <div>
              <h2 className="text-text-primary text-lg font-semibold">Tiket yang Berhasil Dibuat</h2>
              <p className="text-text-tertiary text-sm mt-1">
                Jika email pengiriman gagal, gunakan tombol unduh di bawah untuk mengambil PDF tiket secara manual.
              </p>
            </div>

            {downloadError && (
              <div className="bg-red-50 text-destructive-text p-3 rounded-md text-sm">
                {downloadError}
              </div>
            )}

            {emailFeedback && (
              <div
                className={`p-3 rounded-md text-sm ${
                  emailFeedback.type === "success"
                    ? "bg-green-50 text-success-text"
                    : "bg-red-50 text-destructive-text"
                }`}
              >
                {emailFeedback.msg}
              </div>
            )}

            <div className="divide-y divide-border-subtle">
              {generatedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-text-primary text-sm font-medium">{ticket.categoryName}</p>
                    <p className="text-text-tertiary text-xs">
                      Ticket ID: {ticket.id}
                      {ticket.ticketEventNumber != null ? ` · No. ${ticket.ticketEventNumber}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={emailingIds.has(ticket.id)}
                      onClick={() => handleEmail(ticket.id)}
                    >
                      Kirim Email
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={downloadingIds.has(ticket.id)}
                      onClick={() => handleDownload(ticket.id)}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
