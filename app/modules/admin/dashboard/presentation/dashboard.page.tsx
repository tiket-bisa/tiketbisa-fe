import { useState, useMemo } from "react";
import { Card, SearchInput, Pagination, Select } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { statusFilterOptions } from "~/core/constants/transaction";
import { TransactionTable } from "./components/transaction-table";
import { useApiQuery } from "~/core/api";
import { brandApi } from "~/core/api/services/brand.api";
import { eventApi } from "~/core/api/services/event.api";
import { getDashboardStats } from "~/modules/internal/analytics/analytics.api";
import { allTransactions } from "../infrastructure/transaction.mock";

const ITEMS_PER_PAGE = 5;

/** Admin — Dashboard (overview across all brands) */
export default function AdminDashboardPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch real dashboard stats
  const { data: stats } = useApiQuery(
    async () => {
      return await getDashboardStats();
    },
    [],
  );

  // TODO: Replace with real API when GET /transaction list endpoint is available
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

      {/* Transaction List — TODO: Replace with real API when GET /transaction list endpoint is available */}
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

        <TransactionTable transactions={paged} />

        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
