import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Badge, Button, Card, Input, Select, useToast } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import {
  internalEventApi,
  type EventTicketDashboard,
  type EventTicketCategorySummary,
  type IssuedTicketSummary,
} from "~/core/api/services/internal-event.api";
import { formatIDR } from "~/core/utils";
import { formatTransactionTimestamp } from "~/core/utils";
import { useAuth } from "~/core/auth";
import { transactionApi } from "~/core/api/services/transaction.api";
import { TransactionPaginationControls } from "~/modules/internal/common/presentation/transaction-pagination-controls";
import { toTransactionType, transactionTypeOptions, type TransactionTypeFilter } from "~/core/constants/transaction-type";
import { useRealtimeSubscription, type RealtimeMessage } from "~/core/realtime";
import { TicketDeliveryActions } from "~/modules/internal/ticket-delivery/presentation/ticket-delivery-actions";
import { useDebouncedValue } from "~/modules/internal/common/presentation/use-debounced-value";
import { ticketCategoryApi } from "~/core/api/services/ticket-category.api";
import {
  preGeneratedCodeApi,
  buildTicketCodeExportCsv,
} from "~/core/api/services/pre-generated-code.api";
import { getEventTransactionStatusLabel } from "./event-ticket-status";
import { EventDashboardBackButton, TicketCodeExportButton } from "./event-ticket-dashboard-actions";

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "WAITING_PAYMENT", label: "Menunggu Pembayaran" },
  { value: "WAITING_APPROVAL", label: "Menunggu Approval" },
  { value: "ISSUED", label: "Issued" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "CANCELED", label: "Canceled" },
  { value: "EXPIRED", label: "Expired" },
];

const ISSUED_TICKET_PAGE_SIZE = 50;

const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "brand" }> = {
  WAITING_PAYMENT: { label: "Menunggu Pembayaran", variant: "warning" },
  WAITING_APPROVAL: { label: "Menunggu Approval", variant: "warning" },
  ISSUED: { label: "Issued", variant: "brand" },
  CHECKED_IN: { label: "Checked In", variant: "success" },
  CANCELED: { label: "Canceled", variant: "destructive" },
  CANCELLED: { label: "Canceled", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "warning" },
};

export default function EventTicketDashboardPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = location.pathname.includes("/internal-tb/admin/");
  const basePath = isAdmin ? "/internal-tb/admin" : "/internal-tb/partner";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>("all");
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPageSize, setTransactionPageSize] = useState(5);
  const [issuedTicketOffset, setIssuedTicketOffset] = useState(0);
  const [adjustingCategory, setAdjustingCategory] = useState<EventTicketCategorySummary | null>(null);
  const [preGenerating, setPreGenerating] = useState(false);
  const [downloadingCodes, setDownloadingCodes] = useState(false);
  const { success: successToast, error: errorToast, info: infoToast } = useToast();
  const debouncedSearch = useDebouncedValue(search);

  const { data: fetchedData, loading, error, refetch } = useApiQuery(
    async () => {
      if (!eventId) return null;
      const result = await internalEventApi.getTicketDashboard(eventId, {
        limit: ISSUED_TICKET_PAGE_SIZE,
        offset: issuedTicketOffset,
        search: debouncedSearch.trim() || undefined,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        status: statusFilter === "all" ? undefined : statusFilter,
        transactionType: toTransactionType(transactionType),
      });
      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal memuat data tiket event.");
      }
      return result.data as EventTicketDashboard;
    },
    [eventId, issuedTicketOffset, debouncedSearch, categoryFilter, statusFilter, transactionType],
  );

  const { data: transactionData, loading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useApiQuery(
    async () => {
      if (!eventId || (!isAdmin && !user?.brand_id)) return { transactions: [], totalCount: 0, totalPages: 1 };
      const result = await transactionApi.getList({
        eventId,
        brandId: isAdmin ? undefined : user?.brand_id,
        transactionType: toTransactionType(transactionType),
        search: debouncedSearch.trim() || undefined,
        limit: transactionPageSize,
        offset: (transactionPage - 1) * transactionPageSize,
        orderBy: "created:DESC",
      });
      if (!result.success || !result.data) throw new Error(result.error || "Gagal memuat transaksi event.");
      return {
        transactions: result.data.transactions ?? [],
        totalCount: result.data.totalCount ?? result.data.total_count ?? 0,
        totalPages: result.data.totalPages ?? result.data.total_pages ?? 1,
      };
    },
    [eventId, isAdmin, user?.brand_id, transactionType, debouncedSearch, transactionPage, transactionPageSize],
  );

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    if (message.type === "event_ticket_dashboard.updated" && message.payload) {
      void refetch();
      void refetchTransactions();
      return;
    }
    if (
      message.type === "transaction.updated"
      || message.type === "ticket.checked_in"
      || message.type === "ticket_category.updated"
    ) {
      void refetch();
      void refetchTransactions();
    }
  }, [refetch, refetchTransactions]);

  useRealtimeSubscription(eventId ? [`event:${eventId}`] : [], handleRealtimeMessage);

  useEffect(() => {
    setIssuedTicketOffset(0);
  }, [eventId, debouncedSearch, categoryFilter, statusFilter, transactionType]);

  useEffect(() => { setTransactionPage(1); }, [eventId, debouncedSearch, transactionType]);

  useEffect(() => {
    if (!transactionsLoading && transactionData && transactionPage > transactionData.totalPages) {
      setTransactionPage(Math.max(transactionData.totalPages, 1));
    }
  }, [transactionsLoading, transactionData, transactionPage]);

  const data = fetchedData;

  const categories = useMemo(() => {
    return [...(data?.categories ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "id", { numeric: true, sensitivity: "base" }),
    );
  }, [data?.categories]);

  const categoryOptions = useMemo(() => {
    return [
      { value: "all", label: "Semua Kategori" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ];
  }, [categories]);

  const filteredIssuedTickets = data?.issuedTickets ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-text-tertiary">Memuat dashboard tiket...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <EventDashboardBackButton onClick={() => navigate(`${basePath}/events`)} />
        <Card padding="md">
          <p className="text-destructive-text">{error || "Data tiket tidak ditemukan."}</p>
        </Card>
      </div>
    );
  }

  const totalTicket = data.inventory.totalTicket;
  const soldTicket = data.soldTickets;
  const remainingTicket = data.inventory.remainingTicket;
  const checkedInTicket = data.inventory.checkedInTicket;
  const reservedTicket = data.categories.reduce((sum, category) => sum + category.reservedTicket, 0);
  const bulkTicket = data.categories.reduce((sum, category) => sum + (category.bulkType ? category.issuedTicket : 0), 0);
  const displayedStart = data.totalCount === 0 ? 0 : data.offset + 1;
  const displayedEnd = Math.min(data.offset + data.issuedTickets.length, data.totalCount);
  const canGoPrevious = data.offset > 0;
  const canGoNext = data.offset + data.issuedTickets.length < data.totalCount;

  const handlePreGenerate = async () => {
    if (!eventId) return;
    setPreGenerating(true);
    try {
      const result = await preGeneratedCodeApi.generateForEvent(eventId);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal membuat kode pre-generate.");
      }
      // Zero is a normal outcome, not a failure: every category already holds a full set. Saying
      // so plainly avoids a second press on the assumption nothing happened.
      if (result.data.totalGenerated === 0) {
        infoToast("Semua kategori sudah punya kode untuk sisa tiketnya.");
      } else {
        successToast(`${result.data.totalGenerated} kode berhasil dibuat.`);
      }
      refetch();
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Gagal membuat kode pre-generate.");
    } finally {
      setPreGenerating(false);
    }
  };

  const handleDownloadCodes = async () => {
    if (!eventId) return;
    setDownloadingCodes(true);
    try {
      const result = await preGeneratedCodeApi.exportForEvent(eventId);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal mengunduh kode.");
      }
      if (result.data.totalCount === 0) {
        infoToast("Belum ada kode tiket untuk event ini.");
        return;
      }
      const csv = buildTicketCodeExportCsv(result.data.codes);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const eventName = data.event.name
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      link.download = `kode-tiket-${eventName || eventId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      errorToast(err instanceof Error ? err.message : "Gagal mengunduh kode.");
    } finally {
      setDownloadingCodes(false);
    }
  };
  const eventEnded = data.event.status === "ENDED"
    || (data.event.endDate ? new Date(data.event.endDate).getTime() <= Date.now() : false);
  const goToPreviousPage = () => {
    setIssuedTicketOffset((current) => Math.max(current - ISSUED_TICKET_PAGE_SIZE, 0));
  };
  const goToNextPage = () => {
    if (!canGoNext) return;
    setIssuedTicketOffset((current) => current + ISSUED_TICKET_PAGE_SIZE);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <EventDashboardBackButton onClick={() => navigate(`${basePath}/events`)} />
          <h1 className="text-text-primary text-3xl font-extrabold">{data.event.name}</h1>
          <p className="text-text-tertiary text-sm font-medium">
            Kelola Tiket &amp; Penjualan · Kuota, tiket direservasi, tiket terjual, sisa tiket, dan status check-in
          </p>
          {eventEnded && <Badge variant="destructive">Event Selesai · Penjualan ditutup</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Refresh
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`${basePath}/events/${eventId}/tickets/new`)}>
            Tambah Tiket
          </Button>
          <Button type="button" variant="secondary" disabled={eventEnded} onClick={() => navigate(`${basePath}/events/${eventId}/bulk/new`)}>
            Tiket Bulk
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={eventEnded || preGenerating}
            isLoading={preGenerating}
            onClick={handlePreGenerate}
          >
            Pre-generate Kode
          </Button>
          <TicketCodeExportButton downloading={downloadingCodes} onClick={handleDownloadCodes} />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="w-full sm:w-56">
          <Select label="Transaction Type" options={transactionTypeOptions} value={transactionType}
            onChange={(event) => { setTransactionType(event.target.value as TransactionTypeFilter); setCategoryFilter("all"); }} />
        </div>
        <div className="w-full sm:max-w-md">
          <Input label="Cari tiket atau transaksi" value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari buyer, kode tiket, atau order ID" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        <SummaryCard label="Kuota" value={totalTicket} />
        <SummaryCard label="Direservasi" value={reservedTicket} />
        <SummaryCard label="Revenue" value={formatIDR(data.revenue)} />
        <SummaryCard label="Terjual & Lunas" value={soldTicket} />
        <SummaryCard label="Bulk Terbit" value={bulkTicket} />
        <SummaryCard label="Sisa" value={remainingTicket} />
        <SummaryCard label="Checked In" value={checkedInTicket} />
      </div>
      <p className="text-xs text-text-tertiary">Kuota, Sisa, dan Checked In mencakup seluruh event.</p>

      <Card padding="md">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Kategori Tiket</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-tertiary">
                <th className="px-3 py-2 font-medium">Kategori</th>
                <th className="px-3 py-2 font-medium">Kode</th>
                <th className="px-3 py-2 font-medium">Harga</th>
                <th className="px-3 py-2 font-medium">Visibilitas</th>
                <th className="px-3 py-2 font-medium">Kuota</th>
                <th className="px-3 py-2 font-medium">Direservasi</th>
                <th className="px-3 py-2 font-medium">Terjual &amp; Lunas</th>
                <th className="px-3 py-2 font-medium">Sisa</th>
                <th className="px-3 py-2 font-medium">Checked In</th>
                <th className="px-3 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-3 py-3 font-medium text-text-primary">
                    <div>{category.name}</div>
                    {category.bundleSize > 1 && (
                      <div className="text-xs font-normal text-text-tertiary">Bundling · {category.bundleSize} tiket</div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-text-secondary">{category.categoryCode || "-"}</td>
                  <td className="px-3 py-3 text-text-secondary">{formatIDR(category.price)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={category.salesClosed || category.isHidden ? "warning" : "success"}>
                      {eventEnded ? "Event Selesai" : category.bulkType ? "Bulk" : category.salesClosed ? "Penjualan Ditutup" : "Publik"}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-text-secondary">{category.totalTicket.toLocaleString()}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.reservedTicket.toLocaleString()}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.soldTicket.toLocaleString()}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.remainingTicket.toLocaleString()}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.checkedInTicket.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setAdjustingCategory(category)}>
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {categories.length === 0 && (
          <p className="py-6 text-center text-sm text-text-tertiary">Belum ada kategori tiket.</p>
        )}
      </Card>

      <Card padding="md">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Transaksi Event</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-border-subtle text-left text-text-tertiary">
              <th className="px-3 py-2">ID</th><th className="px-3 py-2">Pembeli</th>
              <th className="px-3 py-2">Waktu</th><th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Status</th><th className="px-3 py-2">Aksi</th>
            </tr></thead>
            <tbody>
              {(!transactionsLoading ? transactionData?.transactions ?? [] : []).map((transaction) => (
                <tr key={transaction.id} className="border-b border-border-subtle">
                  <td className="px-3 py-3 font-mono text-xs">{transaction.id}</td>
                  <td className="px-3 py-3">{transaction.customerName}</td>
                  <td className="px-3 py-3">{formatTransactionTimestamp(transaction.created)}</td>
                  <td className="px-3 py-3 text-right">{formatIDR(transaction.totalPrice)}</td>
                  <td className="px-3 py-3">{getEventTransactionStatusLabel(transaction.status)}</td>
                  <td className="px-3 py-3"><Button type="button" variant="ghost" size="sm"
                    onClick={() => navigate(`${basePath}/transactions/${transaction.id}`)}>Detail</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactionsLoading && <p className="py-4 text-sm text-text-tertiary">Memuat transaksi...</p>}
        {transactionsError && <p className="py-4 text-sm text-destructive-text">{transactionsError}</p>}
        {!transactionsLoading && !transactionsError && !transactionData?.transactions.length && <p className="py-4 text-sm text-text-tertiary">Tidak ada transaksi sesuai filter.</p>}
        <TransactionPaginationControls currentPage={transactionPage} pageSize={transactionPageSize}
          totalCount={transactionData?.totalCount ?? 0} itemCount={transactionData?.transactions.length ?? 0}
          totalPages={transactionData?.totalPages ?? 1} onPageChange={setTransactionPage}
          onPageSizeChange={(size) => { setTransactionPageSize(size); setTransactionPage(1); }} />
      </Card>

      {adjustingCategory && (
        <AdjustCategoryModal
          category={adjustingCategory}
          onClose={() => setAdjustingCategory(null)}
          onSaved={async () => {
            setAdjustingCategory(null);
            await refetch();
          }}
        />
      )}

      <Card padding="md">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="w-full lg:w-56">
            <Select
              label="Kategori"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              options={categoryOptions}
            />
          </div>
          <div className="w-full lg:w-48">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={statusOptions}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1160px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-tertiary">
                <th className="px-3 py-2 font-medium">Tiket</th>
                <th className="px-3 py-2 font-medium">Kategori</th>
                <th className="px-3 py-2 font-medium">Buyer</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Payment</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Check In</th>
                <th className="px-3 py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssuedTickets.map((ticket) => (
                <IssuedTicketRow
                  key={ticket.id}
                  ticket={ticket}
                  transactionTicketCount={
                    ticket.ticketTransactionId
                      ? (data.issuedTickets ?? []).filter((item) => item.ticketTransactionId === ticket.ticketTransactionId).length
                      : 0
                  }
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredIssuedTickets.length === 0 && (
          <p className="py-6 text-center text-sm text-text-tertiary">Tidak ada tiket terjual sesuai filter.</p>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text-tertiary">
            Menampilkan {displayedStart.toLocaleString()}-{displayedEnd.toLocaleString()} dari {data.totalCount.toLocaleString()} tiket
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!canGoPrevious || loading}
            >
              Sebelumnya
            </Button>
            <span className="min-w-20 text-center text-sm text-text-secondary">
              Page {data.currentPage}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToNextPage}
              disabled={!canGoNext || loading}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AdjustCategoryModal({
  category,
  onClose,
  onSaved,
}: {
  category: EventTicketCategorySummary;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [totalTicket, setTotalTicket] = useState(String(category.totalTicket));
  const [salesClosed, setSalesClosed] = useState(category.salesClosed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allocatedTicket = category.soldTicket + category.reservedTicket;

  const save = async () => {
    const parsedTotal = Number(totalTicket);
    if (!Number.isInteger(parsedTotal) || parsedTotal < allocatedTicket) {
      setError(`Total kuota minimal ${allocatedTicket.toLocaleString()} karena tiket tersebut sudah terjual atau direservasi.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await ticketCategoryApi.update(category.id, {
        totalTicket: parsedTotal,
        salesClosed: category.bulkType ? undefined : salesClosed,
      });
      if (!response.success) throw new Error(response.error || "Gagal menyesuaikan kategori.");
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyesuaikan kategori.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Adjust Ticket Category">
      <Card padding="lg" className="w-full max-w-md space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Adjust Ticket Category</h2>
          <p className="text-sm text-text-tertiary">{category.name}</p>
        </div>
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-destructive-text">{error}</div>}
        <div className="grid grid-cols-2 gap-3 rounded-md bg-surface-hover p-3 text-sm">
          <span>Terjual atau direservasi</span><strong className="text-right">{allocatedTicket.toLocaleString()}</strong>
          <span>Sisa saat ini</span><strong className="text-right">{category.remainingTicket.toLocaleString()}</strong>
        </div>
        <Input label="Total Kuota" type="number" min={allocatedTicket} value={totalTicket} onChange={(event) => setTotalTicket(event.target.value)} />
        {!category.bulkType && (
          <label className="flex items-start gap-3 rounded-md border border-border-subtle p-3 text-sm">
            <input type="checkbox" checked={salesClosed} onChange={(event) => setSalesClosed(event.target.checked)} className="mt-0.5 accent-brand-primary" />
            <span><strong className="block">Tutup penjualan</strong><span className="text-text-tertiary">Tampilkan kategori sebagai Sold Out meskipun kursi masih tersedia.</span></span>
          </label>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Batal</Button>
          <Button type="button" variant="primary" onClick={() => void save()} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card padding="md">
      <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value.toLocaleString()}</p>
    </Card>
  );
}

function IssuedTicketRow({
  ticket,
  transactionTicketCount,
}: {
  ticket: IssuedTicketSummary;
  transactionTicketCount: number;
}) {
  const status = statusMap[ticket.status] ?? { label: ticket.status || "-", variant: "default" as const };
  return (
    <tr className="border-b border-border-subtle last:border-0">
      <td className="px-3 py-3">
        <div className="font-medium text-text-primary">
          {ticket.categoryCode && ticket.ticketEventNumber ? `${ticket.categoryCode}-${ticket.ticketEventNumber}` : ticket.id}
        </div>
        <div className="max-w-[220px] truncate font-mono text-xs text-text-tertiary">{ticket.codeHash || ticket.id}</div>
      </td>
      <td className="px-3 py-3 text-text-secondary">{ticket.categoryName}</td>
      <td className="px-3 py-3">
        <div className="text-text-primary">{ticket.customerName || "-"}</div>
        <div className="text-xs text-text-tertiary">{ticket.customerEmail || "-"}</div>
      </td>
      <td className="px-3 py-3">
        <div className="font-mono text-xs text-text-secondary">{ticket.ticketTransactionId || "-"}</div>
        <div className="text-xs text-text-tertiary">{formatDateTime(ticket.created)}</div>
      </td>
      <td className="px-3 py-3">
        <div className="text-text-secondary">{ticket.paymentMethod || "-"}</div>
        <div className="text-xs text-text-tertiary">{getEventTransactionStatusLabel(ticket.transactionStatus)}</div>
      </td>
      <td className="px-3 py-3">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>
      <td className="px-3 py-3 text-text-secondary">{formatDateTime(ticket.checkInTime)}</td>
      <td className="px-3 py-3">
        <TicketDeliveryActions
          transactionId={ticket.ticketTransactionId}
          customerName={ticket.customerName}
          customerEmail={ticket.customerEmail}
          ticketCount={transactionTicketCount}
          buttonLabel="Tiket"
        />
      </td>
    </tr>
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
