import { useState, useMemo } from "react";
import { Card, SearchInput, Pagination, Select } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { statusFilterOptions } from "~/core/constants/transaction";
import { TransactionTable } from "./components/transaction-table";
import { transactionApi, mapTransactionApiToFe } from "~/core/api/services/transaction.api";
import { analyticsApi } from "~/modules/internal/analytics/analytics.api";

const ITEMS_PER_PAGE = 5;

/** Admin — Dashboard (overview across all brands) */
export default function AdminDashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch real dashboard stats
  const { data: stats } = useApiQuery(
    async () => {
      return await analyticsApi.getDashboardStats();
    },
    [],
  );

  // Fetch real transaction list
  const { data: transactionRes, loading: loadingTransactions } = useApiQuery(
    async () => {
      const res = await transactionApi.getList({
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
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
    [currentPage, search, statusFilter],
  );

  const transactions = transactionRes?.transactions ?? [];
  const totalPages = transactionRes?.totalPages ?? 1;

  return (
    <div className="space-y-8">
      <h1 className="text-text-primary text-2xl font-bold">Dashboard Admin</h1>

      {/* Platform Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Brand</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{stats?.totalBrands ?? "..."}</p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Event</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{stats?.totalEvents ?? "..."}</p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Total Revenue</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{stats ? formatIDR(stats.totalRevenue) : "..."}</p>
        </Card>
        <Card padding="md">
          <p className="text-text-tertiary text-xs uppercase tracking-wide">Tiket Terjual</p>
          <p className="text-text-primary text-2xl font-bold mt-1">{stats?.totalTicketsSold ?? "..."}</p>
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

        {loadingTransactions ? (
          <Card padding="md">
            <div className="text-center py-12 text-text-tertiary">Memuat transaksi...</div>
          </Card>
        ) : (
          <TransactionTable transactions={transactions} />
        )}

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
