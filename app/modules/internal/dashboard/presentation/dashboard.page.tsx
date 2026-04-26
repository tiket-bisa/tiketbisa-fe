import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import { Card, Badge, SearchInput, Pagination, Select } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { useAuth } from "~/core/auth";
import { getDashboardStats, type DashboardStats } from "../../analytics/analytics.api";
import { transactionApi, mapTransactionApiToFe } from "~/core/api/services/transaction.api";
import { useApiQuery } from "~/core/api";

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

/** Partner — Dashboard / Beranda (filtered by partner's brand) */
export default function DashboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => console.error("Failed to load dashboard stats:", err))
      .finally(() => setIsStatsLoading(false));
  }, []);

  // Fetch real transaction list
  const { data: transactionRes, loading: loadingTransactions } = useApiQuery(
    async () => {
      // Don't fetch if brand is not loaded yet
      if (!user?.brand_slug) return { transactions: [], totalPages: 1 };
      
      const res = await transactionApi.getList({
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
        brandId: user.brand_id,
        customerName: search || undefined,
        status: statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
      });
      if (res.success && res.data) {
        return {
          transactions: (res.data.transactions ?? []).map(mapTransactionApiToFe),
          totalPages: res.data.total_pages ?? 1,
        };
      }
      return { transactions: [], totalPages: 1 };
    },
    [currentPage, search, statusFilter, user?.brand_slug, user?.brand_id],
  );

  const paged = transactionRes?.transactions ?? [];
  const totalPages = transactionRes?.totalPages ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">Beranda</h1>
        {user?.brand_name && (
          <p className="text-text-tertiary text-sm mt-1">{user.brand_name}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">
            Total Revenue
          </p>
          <p className="text-text-primary text-2xl font-bold mt-1">
            {isStatsLoading ? "..." : formatIDR(stats?.totalRevenue ?? 0)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">
            Tiket Terjual
          </p>
          <p className="text-text-primary text-2xl font-bold mt-1">
            {isStatsLoading ? "..." : (stats?.totalTicketsSold ?? 0)}
          </p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">
            Total Event
          </p>
          <p className="text-text-primary text-2xl font-bold mt-1">
            {isStatsLoading ? "..." : (stats?.totalEvents ?? 0)}
          </p>
        </Card>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="text-text-primary text-lg font-semibold mb-4">
          List Transaksi
        </h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Cari transaksi..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => {
                setSearch("");
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              label=""
            />
          </div>
        </div>

        {/* Table */}
        {loadingTransactions ? (
          <Card padding="md">
            <div className="text-center py-12 text-text-tertiary">Memuat transaksi...</div>
          </Card>
        ) : (
          <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-text-tertiary text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Pembeli</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((tx) => {
                  const status = STATUS_MAP[tx.status];
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border-subtle hover:bg-surface-hover transition-colors"
                    >
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                        {tx.id}
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        {tx.buyer_name}
                      </td>
                      <td className="px-4 py-3 text-text-primary text-right font-medium">
                        {formatIDR(tx.total_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/internal-tb/partner/transactions/${tx.id}`}
                          className="text-brand-primary text-xs hover:underline"
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-text-tertiary"
                    >
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
