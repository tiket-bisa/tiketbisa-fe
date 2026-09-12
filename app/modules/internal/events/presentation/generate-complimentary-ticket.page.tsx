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
import { isValidDotComEmail } from "~/core/utils/form-validation";

interface GeneratedTicketRow extends IssuedTicketDetail {
  categoryName: string;
}

export default function GenerateBulkTicketPage() {
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
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    codeType: "QR_CODE" as "QR_CODE" | "BARCODE",
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categoryQuantities, setCategoryQuantities] = useState<Record<string, string>>({});

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
      const res = await ticketCategoryApi.getInternalByEvent(eventId);
      return res.success && res.data ? res.data : [];
    },
    [eventId],
  );

  const categories = useMemo(
    () => (categoriesRaw ?? []).filter((category) => category.is_hidden).map(mapTicketCategoryToFe),
    [categoriesRaw],
  );

  const eventsPath = user?.role === "admin" ? "/internal-tb/admin/events" : "/internal-tb/partner/events";
  const returnPath = eventId ? `${eventsPath}/${eventId}/tickets` : eventsPath;
  const eventEnded = event?.status === "ENDED"
    || (event?.endDate ? new Date(event.endDate).getTime() <= Date.now() : false);

  const handleToggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      if (prev.includes(catId)) {
        return prev.filter((id) => id !== catId);
      }
      return [...prev, catId];
    });
    setCategoryQuantities((prev) => {
      if (prev[catId] === undefined) {
        return { ...prev, [catId]: "1" };
      }
      return prev;
    });
  };

  const handleSelectAll = () => {
    const availableCategories = categories.filter((c) => c.available > 0);
    const availableIds = availableCategories.map((c) => c.id);
    setSelectedCategoryIds(availableIds);
    setCategoryQuantities((prev) => {
      const next = { ...prev };
      for (const cat of availableCategories) {
        if (next[cat.id] === undefined) {
          next[cat.id] = "1";
        }
      }
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedCategoryIds([]);
  };

  const handleQuantityChange = (catId: string, value: string) => {
    setCategoryQuantities((prev) => ({
      ...prev,
      [catId]: value,
    }));
  };

  const totalQuantity = useMemo(() => {
    return selectedCategoryIds.reduce((sum, catId) => {
      const qty = parseInt(categoryQuantities[catId] || "0", 10);
      return sum + (Number.isNaN(qty) || qty < 0 ? 0 : qty);
    }, 0);
  }, [selectedCategoryIds, categoryQuantities]);

  const hasInvalidQuantity = useMemo(() => {
    if (selectedCategoryIds.length === 0) return true;
    for (const catId of selectedCategoryIds) {
      const cat = categories.find((c) => c.id === catId);
      const qty = parseInt(categoryQuantities[catId] || "0", 10);
      if (!cat || Number.isNaN(qty) || qty < 1 || qty > cat.available) {
        return true;
      }
    }
    return false;
  }, [selectedCategoryIds, categoryQuantities, categories]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (formData.customerName.trim().length < 3) {
      setErrorMsg("Nama penerima minimal 3 karakter.");
      return;
    }
    if (!isValidDotComEmail(formData.customerEmail)) {
      setErrorMsg("Email harus valid dan menggunakan domain .com.");
      return;
    }
    const normalizedPhone = normalizeIndonesianPhone(formData.customerPhone);
    if (!normalizedPhone) {
      setErrorMsg("Nomor HP harus menggunakan format 08… atau +628…");
      return;
    }
    if (selectedCategoryIds.length === 0) {
      setErrorMsg("Pilih minimal satu kategori tiket terlebih dahulu.");
      return;
    }
    for (const catId of selectedCategoryIds) {
      const selectedCategory = categories.find((category) => category.id === catId);
      if (!selectedCategory) {
        setErrorMsg("Kategori yang dipilih tidak valid.");
        return;
      }
      const quantity = Number(categoryQuantities[catId]);
      if (!Number.isInteger(quantity) || quantity < 1) {
        setErrorMsg(`Jumlah tiket untuk kategori "${selectedCategory.name}" minimal 1.`);
        return;
      }
      if (quantity > selectedCategory.available) {
        setErrorMsg(`Jumlah tiket untuk kategori "${selectedCategory.name}" melebihi sisa stok (${selectedCategory.available}).`);
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setGeneratedTickets([]);
    setDownloadError(null);
    setLastTransactionId(null);

    try {
      const tickets = selectedCategoryIds.map((catId) => ({
        categoryId: catId,
        quantity: Number(categoryQuantities[catId]),
      }));

      const res = await transactionApi.manualGenerateTickets({
        eventId,
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: normalizedPhone,
        paymentMethod: "COMPLIMENTARY",
        codeType: formData.codeType,
        tickets,
      });

      if (res.success) {
        setSuccessMsg("Tiket Bulk berhasil dibuat dan dikirim jika template email aktif.");
        setFormData((prev) => ({
          ...prev,
          customerName: "",
          customerEmail: "",
          customerPhone: "",
        }));
        setSelectedCategoryIds([]);
        setCategoryQuantities({});

        const transactionId = res.data?.id;
        if (transactionId) {
          setLastTransactionId(transactionId);
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
        setErrorMsg(res.error || "Gagal membuat Tiket Bulk.");
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

  const handleDownloadAllZip = async (txId: string) => {
    setDownloadingAll(true);
    setDownloadError(null);
    try {
      const result = await transactionApi.downloadTickets(txId);
      if (!result.success || !result.data) {
        setDownloadError(result.error || "Gagal mengunduh berkas tiket.");
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
      setDownloadError(toUserFacingError(err, "Gagal mengunduh berkas tiket."));
    } finally {
      setDownloadingAll(false);
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
          onClick={() => navigate(returnPath)}
          className="text-text-secondary hover:text-text-primary"
          aria-label="Kembali"
        >
          <span className="material-symbols-outlined text-xl leading-none">arrow_back</span>
        </button>
        <div>
          <h1 className="text-text-primary text-2xl font-bold">Generate Tiket Bulk</h1>
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
          {eventEnded && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-destructive-text">
              Event telah selesai. Tiket Bulk baru tidak dapat diterbitkan.
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

          {/* Category Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text-primary">
                Kategori Tiket <span className="text-destructive-text">*</span>
              </label>
              {categories.length > 1 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs font-medium text-brand-primary hover:underline"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-text-tertiary text-xs">·</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-xs font-medium text-text-tertiary hover:text-text-primary hover:underline"
                  >
                    Hapus Pilihan
                  </button>
                </div>
              )}
            </div>

            {loadingCategories ? (
              <p className="text-sm text-text-tertiary">Memuat kategori hidden...</p>
            ) : categories.length === 0 ? (
              <div className="rounded-lg border border-border-default bg-surface-alt p-3 text-sm text-text-tertiary text-center">
                Belum ada kategori hidden yang tersedia untuk Tiket Bulk.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {categories.map((category) => {
                  const isChecked = selectedCategoryIds.includes(category.id);
                  const isOutOfStock = category.available <= 0;
                  return (
                    <label
                      key={category.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                        isOutOfStock
                          ? "cursor-not-allowed border-border-default bg-surface-alt/50 opacity-60"
                          : isChecked
                            ? "border-brand-primary bg-brand-primary-subtle text-text-primary"
                            : "border-border-default bg-surface-alt hover:bg-surface-hover"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isOutOfStock}
                        checked={isChecked}
                        onChange={() => handleToggleCategory(category.id)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-primary accent-brand-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text-primary leading-tight">{category.name}</p>
                        <p className="mt-1 text-xs text-text-tertiary">
                          {formatIDR(category.price)} · Sisa stok:{" "}
                          <span
                            className={
                              isOutOfStock
                                ? "font-semibold text-destructive-text"
                                : "font-medium text-text-primary"
                            }
                          >
                            {category.available}
                          </span>
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dynamic Quantity Section per Chosen Category */}
          {selectedCategoryIds.length > 0 && (
            <div className="space-y-3 rounded-xl border border-border-default bg-surface-alt/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Jumlah Tiket per Kategori ({selectedCategoryIds.length} dipilih)
                  </h3>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Tentukan jumlah tiket yang ingin diterbitkan untuk masing-masing kategori
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-text-tertiary block">Total Tiket</span>
                  <span className="text-base font-bold text-brand-primary">{totalQuantity}</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                {selectedCategoryIds.map((catId) => {
                  const cat = categories.find((c) => c.id === catId);
                  if (!cat) return null;
                  const qtyValue = categoryQuantities[catId] ?? "1";
                  const numericQty = parseInt(qtyValue, 10);
                  const isOverStock = !Number.isNaN(numericQty) && numericQty > cat.available;
                  return (
                    <div
                      key={cat.id}
                      className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between bg-surface ${
                        isOverStock ? "border-destructive-border" : "border-border-subtle"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary truncate">{cat.name}</p>
                          <span className="rounded bg-surface-alt px-2 py-0.5 text-xs text-text-secondary border border-border-subtle">
                            Maks: {cat.available}
                          </span>
                        </div>
                        {isOverStock && (
                          <p className="text-xs text-destructive-text mt-1">
                            Jumlah melebihi stok yang tersedia ({cat.available}).
                          </p>
                        )}
                      </div>
                      <div className="w-full sm:w-44 flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            id={`quantity-${cat.id}`}
                            aria-label={`Jumlah tiket untuk ${cat.name}`}
                            type="number"
                            min="1"
                            max={cat.available}
                            className={`w-full rounded-md border p-2 pr-12 text-sm ${
                              isOverStock ? "border-destructive-border bg-red-50/30" : "border-gray-300"
                            }`}
                            value={qtyValue}
                            onChange={(e) => handleQuantityChange(cat.id, e.target.value)}
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-text-tertiary pointer-events-none">
                            tiket
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat.id)}
                          aria-label={`Hapus ${cat.name}`}
                          className="text-text-tertiary hover:text-destructive-text p-1 transition-colors"
                          title="Hapus kategori ini"
                        >
                          <span className="material-symbols-outlined text-lg leading-none">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="w-full sm:w-1/2">
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
            <Button type="button" variant="ghost" onClick={() => navigate(returnPath)}>
              Kembali
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              disabled={eventEnded || loadingCategories || categories.length === 0 || hasInvalidQuantity}
            >
              Generate Tiket Bulk
            </Button>
          </div>
        </form>
      </Card>

      {generatedTickets.length > 0 && (
        <Card padding="lg">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-text-primary text-lg font-semibold">Tiket yang Berhasil Dibuat</h2>
                <p className="text-text-tertiary text-sm mt-1">
                  Total {generatedTickets.length} tiket berhasil dibuat. Jika email pengiriman gagal, unduh PDF tiket secara manual di bawah.
                </p>
              </div>
              {lastTransactionId && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  isLoading={downloadingAll}
                  onClick={() => handleDownloadAllZip(lastTransactionId)}
                >
                  Download Semua (.zip)
                </Button>
              )}
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
