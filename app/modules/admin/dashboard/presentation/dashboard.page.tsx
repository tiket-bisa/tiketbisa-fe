import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { Card, SearchInput, Select } from "~/core/design-system/components";
import { formatIDR } from "~/core/utils";
import { mapTransactionStatusFilterToApi, statusFilterOptions, type TransactionStatus } from "~/core/constants/transaction";
import { TransactionTable } from "./components/transaction-table";
import { transactionApi, mapTransactionApiToFe } from "~/core/api/services/transaction.api";
import { useApiQuery } from "~/core/api";
import { analyticsApi } from "~/modules/internal/analytics/analytics.api";
import { TransactionPaginationControls } from "~/modules/internal/common/presentation/transaction-pagination-controls";
import { useDebouncedValue } from "~/modules/internal/common/presentation/use-debounced-value";
import { useRealtimeSubscription, type RealtimeMessage } from "~/core/realtime";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = new Set([5, 10, 25, 50]);

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | null): number {
  const parsed = parsePositiveInt(value, DEFAULT_PAGE_SIZE);
  return PAGE_SIZE_OPTIONS.has(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

function buildDashboardParams({
  currentPage,
  pageSize,
  search,
  statusFilter,
}: {
  currentPage: number;
  pageSize: number;
  search: string;
  statusFilter: string;
}) {
  const params = new URLSearchParams();
  if (currentPage > 1) params.set("page", String(currentPage));
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(pageSize));
  if (search.trim()) params.set("search", search.trim());
  if (statusFilter !== "all") params.set("status", statusFilter);
  return params;
}

/** Admin — Dashboard (overview across all brands) */
export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "all");
  const [currentPage, setCurrentPage] = useState(() => parsePositiveInt(searchParams.get("page"), 1));
  const [pageSize, setPageSize] = useState(() => parsePageSize(searchParams.get("pageSize")));
  const debouncedSearch = useDebouncedValue(search);

  // Fetch real dashboard stats
  const { data: stats, refetch: refetchStats } = useApiQuery(
    async () => {
      return await analyticsApi.getDashboardStats();
    },
    [],
  );

  // Fetch real transaction list
  const { data: transactionRes, loading: loadingTransactions, refetch: refetchTransactions } = useApiQuery(
    async () => {
      const res = await transactionApi.getList({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        customerName: debouncedSearch || undefined,
        status: mapTransactionStatusFilterToApi(statusFilter as "all" | TransactionStatus),
      });
      if (res.success && res.data) {
        return {
          transactions: (res.data.transactions ?? []).map(mapTransactionApiToFe),
          totalCount: res.data.totalCount ?? res.data.total_count ?? 0,
          totalPages: res.data.totalPages ?? res.data.total_pages ?? 1,
        };
      }
      return { transactions: [], totalCount: 0, totalPages: 1 };
    },
    [currentPage, pageSize, debouncedSearch, statusFilter],
  );

  const transactions = transactionRes?.transactions ?? [];
  const totalCount = transactionRes?.totalCount ?? 0;
  const totalPages = transactionRes?.totalPages ?? 1;
  const dashboardParams = buildDashboardParams({ currentPage, pageSize, search: debouncedSearch, statusFilter });
  const returnTo = `/internal-tb/admin${dashboardParams.toString() ? `?${dashboardParams.toString()}` : ""}`;

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    if (message.type === "dashboard_stats.updated") {
      void refetchStats();
    }
    if (message.type === "transaction.updated") {
      void refetchTransactions();
      void refetchStats();
    }
  }, [refetchStats, refetchTransactions]);

  useRealtimeSubscription(["admin"], handleRealtimeMessage);

  useEffect(() => {
    setSearchParams(buildDashboardParams({ currentPage, pageSize, search: debouncedSearch, statusFilter }), { replace: true });
  }, [currentPage, pageSize, debouncedSearch, statusFilter, setSearchParams]);

  useEffect(() => {
    if (!loadingTransactions && currentPage > totalPages) {
      setCurrentPage(Math.max(totalPages, 1));
    }
  }, [currentPage, loadingTransactions, totalPages]);

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
          <TransactionTable transactions={transactions} returnTo={returnTo} />
        )}

        <TransactionPaginationControls
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={totalCount}
          itemCount={transactions.length}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
