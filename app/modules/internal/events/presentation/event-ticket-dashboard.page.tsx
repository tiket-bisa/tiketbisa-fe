import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Badge, Button, Card, Input, Select } from "~/core/design-system/components";
import { useApiQuery } from "~/core/api";
import {
  internalEventApi,
  type EventTicketDashboard,
  type IssuedTicketSummary,
} from "~/core/api/services/internal-event.api";
import { formatIDR } from "~/core/utils";

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "ISSUED", label: "Issued" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "CANCELED", label: "Canceled" },
  { value: "EXPIRED", label: "Expired" },
];

const statusMap: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "brand" }> = {
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
  const isAdmin = location.pathname.includes("/internal-tb/admin/");
  const basePath = isAdmin ? "/internal-tb/admin" : "/internal-tb/partner";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, loading, error, refetch } = useApiQuery(
    async () => {
      if (!eventId) return null;
      const result = await internalEventApi.getTicketDashboard(eventId);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Gagal memuat data tiket event.");
      }
      return result.data as EventTicketDashboard;
    },
    [eventId],
  );

  const categoryOptions = useMemo(() => {
    const categories = data?.categories ?? [];
    return [
      { value: "all", label: "Semua Kategori" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ];
  }, [data?.categories]);

  const filteredIssuedTickets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data?.issuedTickets ?? []).filter((ticket) => {
      const matchesCategory = categoryFilter === "all" || ticket.ticketCategoryId === categoryFilter;
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const searchable = [
        ticket.id,
        ticket.codeHash,
        ticket.categoryName,
        ticket.ticketTransactionId,
        ticket.customerName,
        ticket.customerEmail,
        ticket.customerPhone,
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [categoryFilter, data?.issuedTickets, search, statusFilter]);

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
        <Button type="button" variant="ghost" onClick={() => navigate(`${basePath}/events`)}>
          Kembali
        </Button>
        <Card padding="md">
          <p className="text-destructive-text">{error || "Data tiket tidak ditemukan."}</p>
        </Card>
      </div>
    );
  }

  const totalTicket = data.categories.reduce((sum, category) => sum + category.totalTicket, 0);
  const soldTicket = data.categories.reduce((sum, category) => sum + category.soldTicket, 0);
  const remainingTicket = data.categories.reduce((sum, category) => sum + category.remainingTicket, 0);
  const checkedInTicket = data.categories.reduce((sum, category) => sum + category.checkedInTicket, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button type="button" variant="ghost" onClick={() => navigate(`${basePath}/events`)} className="mb-2">
            Kembali
          </Button>
          <h1 className="text-text-primary text-2xl font-bold">Ticket</h1>
          <p className="text-text-tertiary text-sm">{data.event.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Refresh
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`${basePath}/events/${eventId}/tickets/new`)}>
            Tambah Tiket
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`${basePath}/events/${eventId}/complimentary/new`)}>
            Tiket Gratis
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Kuota" value={totalTicket} />
        <SummaryCard label="Terjual" value={soldTicket} />
        <SummaryCard label="Sisa" value={remainingTicket} />
        <SummaryCard label="Checked In" value={checkedInTicket} />
      </div>

      <Card padding="md">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Kategori Tiket</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-tertiary">
                <th className="px-3 py-2 font-medium">Kategori</th>
                <th className="px-3 py-2 font-medium">Kode</th>
                <th className="px-3 py-2 font-medium">Harga</th>
                <th className="px-3 py-2 font-medium">Kuota</th>
                <th className="px-3 py-2 font-medium">Terjual</th>
                <th className="px-3 py-2 font-medium">Sisa</th>
                <th className="px-3 py-2 font-medium">Checked In</th>
              </tr>
            </thead>
            <tbody>
              {data.categories.map((category) => (
                <tr key={category.id} className="border-b border-border-subtle last:border-0">
                  <td className="px-3 py-3 font-medium text-text-primary">{category.name}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.categoryCode || "-"}</td>
                  <td className="px-3 py-3 text-text-secondary">{formatIDR(category.price)}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.totalTicket.toLocaleString()}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.soldTicket.toLocaleString()}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.remainingTicket.toLocaleString()}</td>
                  <td className="px-3 py-3 text-text-secondary">{category.checkedInTicket.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.categories.length === 0 && (
          <p className="py-6 text-center text-sm text-text-tertiary">Belum ada kategori tiket.</p>
        )}
      </Card>

      <Card padding="md">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label="Cari tiket"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari buyer, kode tiket, atau order ID"
            />
          </div>
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
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-text-tertiary">
                <th className="px-3 py-2 font-medium">Tiket</th>
                <th className="px-3 py-2 font-medium">Kategori</th>
                <th className="px-3 py-2 font-medium">Buyer</th>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Payment</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Check In</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssuedTickets.map((ticket) => (
                <IssuedTicketRow key={ticket.id} ticket={ticket} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredIssuedTickets.length === 0 && (
          <p className="py-6 text-center text-sm text-text-tertiary">Tidak ada tiket terjual sesuai filter.</p>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="md">
      <p className="text-xs font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text-primary">{value.toLocaleString()}</p>
    </Card>
  );
}

function IssuedTicketRow({ ticket }: { ticket: IssuedTicketSummary }) {
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
        <div className="text-xs text-text-tertiary">{ticket.transactionStatus || "-"}</div>
      </td>
      <td className="px-3 py-3">
        <Badge variant={status.variant}>{status.label}</Badge>
      </td>
      <td className="px-3 py-3 text-text-secondary">{formatDateTime(ticket.checkInTime)}</td>
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
