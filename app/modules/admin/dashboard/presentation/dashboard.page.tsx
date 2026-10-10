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
import { parseTransactionType, toTransactionType, transactionTypeOptions, type TransactionTypeFilter } from "~/core/constants/transaction-type";
import { DashboardFilters } from "./components/dashboard-filters";

const DEFAULT_PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = new Set([5, 10, 25, 50]);
type TransactionSort = "newest" | "oldest";

const transactionSortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "oldest", label: "Terlama" },
];

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
  sortOrder,
  transactionType,
  brandIdFilter,
  eventIdFilter,
}: {
  currentPage: number;
  pageSize: number;
  search: string;
  statusFilter: string;
  sortOrder: TransactionSort;
  transactionType: TransactionTypeFilter;
  brandIdFilter: string;
  eventIdFilter: string;
}) {
  const params = new URLSearchParams();
  if (currentPage > 1) params.set("page", String(currentPage));
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(pageSize));
  if (search.trim()) params.set("search", search.trim());
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (sortOrder !== "newest") params.set("sort", sortOrder);
  if (transactionType !== "all") params.set("transactionType", transactionType);
  if (brandIdFilter !== "all") params.set("brandId", brandIdFilter);
  if (eventIdFilter !== "all") params.set("eventId", eventIdFilter);
  return params;
}

/** Admin — Dashboard (overview across all brands) */
export default function AdminDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") ?? "all");
  const [sortOrder, setSortOrder] = useState<TransactionSort>(() => searchParams.get("sort") === "oldest" ? "oldest" : "newest");
  const [transactionType, setTransactionType] = useState<TransactionTypeFilter>(() => parseTransactionType(searchParams.get("transactionType")));
  const [currentPage, setCurrentPage] = useState(() => parsePositiveInt(searchParams.get("page"), 1));
  const [pageSize, setPageSize] = useState(() => parsePageSize(searchParams.get("pageSize")));
  const [brandIdFilter, setBrandIdFilter] = useState(() => searchParams.get("brandId") ?? "all");
  const [eventIdFilter, setEventIdFilter] = useState(() => searchParams.get("eventId") ?? "all");
  const debouncedSearch = useDebouncedValue(search);

  // Fetch real dashboard stats
  const { data: stats, refetch: refetchStats } = useApiQuery(
    async () => {
      return await analyticsApi.getDashboardStats(
        brandIdFilter === "all" ? undefined : brandIdFilter,
        toTransactionType(transactionType),
        eventIdFilter === "all" ? undefined : eventIdFilter
      );
    },
    [brandIdFilter, transactionType, eventIdFilter],
  );

  // Fetch real transaction list
  const { data: transactionRes, loading: loadingTransactions, refetch: refetchTransactions } = useApiQuery(
    async () => {
      const res = await transactionApi.getList({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        search: debouncedSearch || undefined,
        status: mapTransactionStatusFilterToApi(statusFilter as "all" | TransactionStatus),
        transactionType: toTransactionType(transactionType),
        brandId: brandIdFilter === "all" ? undefined : brandIdFilter,
        eventId: eventIdFilter === "all" ? undefined : eventIdFilter,
        orderBy: sortOrder === "oldest" ? "created:ASC" : "created:DESC",
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
    [currentPage, pageSize, debouncedSearch, statusFilter, sortOrder, transactionType, brandIdFilter, eventIdFilter],
  );

  const transactions = transactionRes?.transactions ?? [];
  const totalCount = transactionRes?.totalCount ?? 0;
  const totalPages = transactionRes?.totalPages ?? 1;
  const dashboardParams = buildDashboardParams({ currentPage, pageSize, search: debouncedSearch, statusFilter, sortOrder, transactionType, brandIdFilter, eventIdFilter });
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
    setSearchParams(buildDashboardParams({ currentPage, pageSize, search: debouncedSearch, statusFilter, sortOrder, transactionType, brandIdFilter, eventIdFilter }), { replace: true });
  }, [currentPage, pageSize, debouncedSearch, statusFilter, sortOrder, transactionType, brandIdFilter, eventIdFilter, setSearchParams]);

  useEffect(() => {
    if (!loadingTransactions && currentPage > totalPages) {
      setCurrentPage(Math.max(totalPages, 1));
    }
  }, [currentPage, loadingTransactions, totalPages]);

  return (
    <div className="space-y-8">
      <h1 className="text-text-primary text-2xl font-bold">Dashboard Admin</h1>

      <div className="w-full sm:w-56">
        <Select label="Transaction Type" options={transactionTypeOptions} value={transactionType}
          onChange={(event) => { setTransactionType(event.target.value as TransactionTypeFilter); setCurrentPage(1); }} />
      </div>

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
          {transactionType === "all" && <p className="text-xs text-text-tertiary">Termasuk tiket bulk</p>}
        </Card>
      </div>

      {/* Transaction List */}
      <div>
        <h2 className="text-text-primary text-lg font-semibold mb-4">
          Semua Transaksi
        </h2>

        <DashboardFilters
          search={search}
          onSearchChange={(val) => { setSearch(val); setCurrentPage(1); }}
          brandIdFilter={brandIdFilter}
          onBrandIdFilterChange={(val) => { setBrandIdFilter(val); setCurrentPage(1); }}
          eventIdFilter={eventIdFilter}
          onEventIdFilterChange={(val) => { setEventIdFilter(val); setCurrentPage(1); }}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
          sortOrder={sortOrder}
          onSortOrderChange={(val) => { setSortOrder(val); setCurrentPage(1); }}
        />

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
