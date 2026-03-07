import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Card, Badge, SearchInput, Pagination, Select } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { allTransactions } from "../infrastructure/transaction.mock";
import { allBrands } from "../../brands/infrastructure/brand.mock";
import { allEvents } from "../../events/infrastructure/event.mock";

const STATUS_MAP = {
  paid: { label: "Lunas", variant: "success" as const },
  pending: { label: "Menunggu", variant: "warning" as const },
  cancelled: { label: "Dibatalkan", variant: "destructive" as const },
  refunded: { label: "Refund", variant: "default" as const },
};

const ITEMS_PER_PAGE = 5;

const statusFilterOptions = [
  { value: "all", label: "Semua Status" },
  { value: "paid", label: "Lunas" },
  { value: "pending", label: "Menunggu" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "refunded", label: "Refund" },
];

/** Admin — Dashboard (overview across all brands) */
export default function AdminDashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const totalRevenue = allTransactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.total_price, 0);
  const totalTransactions = allTransactions.length;
  const totalTicketsSold = allTransactions
    .filter((t) => t.status === "paid")
    .reduce((sum, t) => sum + t.quantity, 0);

  const filtered = useMemo(() => {
    return allTransactions.filter((t) => {
      const matchesSearch =
        t.buyer_name.toLowerCase().includes(search.toLowerCase()) ||
        t.event_name.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-8">
      <h1 className="text-text-primary text-2xl font-bold">Dashboard Admin</h1>

      {/* Platform Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Brand</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{allBrands.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Event</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{allEvents.length}</p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Revenue</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{formatIDR(totalRevenue)}</p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Tiket Terjual</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{totalTicketsSold}</p>
        </Card>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="text-text-primary text-lg font-semibold mb-4">
          Semua Transaksi
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              onClear={() => { setSearch(""); setCurrentPage(1); }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              label=""
            />
          </div>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">Pembeli</th>
                  <th className="text-left px-4 py-3 font-medium">Tiket</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((tx) => {
                  const status = STATUS_MAP[tx.status];
                  return (
                    <tr key={tx.id} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">{tx.id}</td>
                      <td className="px-4 py-3 text-text-primary">{tx.event_name}</td>
                      <td className="px-4 py-3 text-text-primary">{tx.buyer_name}</td>
                      <td className="px-4 py-3 text-text-secondary">{tx.ticket_name} &times; {tx.quantity}</td>
                      <td className="px-4 py-3 text-text-primary text-right font-medium">{formatIDR(tx.total_price)}</td>
                      <td className="px-4 py-3 text-center"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        <Link to={`/admin/transactions/${tx.id}`} className="text-brand-primary text-xs hover:underline">
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-text-tertiary">Tidak ada transaksi ditemukan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
