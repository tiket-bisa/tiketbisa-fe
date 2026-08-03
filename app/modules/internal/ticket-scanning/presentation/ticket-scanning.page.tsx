import { useCallback, useState } from "react";
import { Link } from "react-router";
import { Card, Tabs, Button } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { useApiQuery } from "~/core/api";
import type { TicketDashboardSummary } from "~/core/types";
import { analyticsApi } from "~/modules/internal/analytics/analytics.api";
import { ScanSection, QrGeneratorSection } from "./components";
import { useRealtimeSubscription, type RealtimeMessage } from "~/core/realtime";

const tabItems = [
  { value: "scan", label: "Scan Tiket" },
  { value: "generate", label: "Generate QR" },
  { value: "dashboard", label: "Dashboard Tiket" },
];

/** Partner — Ticket Scanning (filtered by partner's brand) */
export default function TicketScanningPage() {
  const [tab, setTab] = useState("scan");
  const { user } = useAuth(); // <-- Added this to fix the missing user reference

  // Fetch ticket dashboard from API, filtered by partner's brand events
  const { data: ticketDashboard, loading, error, refetch } = useApiQuery(
    async () => {
      if (!user?.brand_id) return [] as TicketDashboardSummary[];
      const summaries = await analyticsApi.getTicketScanningDashboard(user.brand_id);
      return summaries.map((summary): TicketDashboardSummary => ({
        event_id: summary.eventId,
        event_name: summary.eventName,
        brand_slug: user.brand_slug,
        total_tickets: Number(summary.totalTickets || 0),
        available_tickets: Number(summary.availableTickets || 0),
        sold_tickets: Number(summary.soldTickets || 0),
        checked_in_tickets: Number(summary.checkedInTickets || 0),
      }));
    },
    [user?.brand_id, user?.brand_slug],
  );

  const dashboard = ticketDashboard ?? [];

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    if (message.type === "ticket.checked_in" || message.type === "event_ticket_dashboard.updated") {
      void refetch();
    }
  }, [refetch]);

  useRealtimeSubscription(user?.brand_id ? [`brand:${user.brand_id}`] : [], handleRealtimeMessage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-text-primary text-2xl font-bold">Scan Tiket</h1>
        <Link to="/internal-tb/partner/partner-tickets">
          <Button variant="secondary" size="sm">
            Impor Tiket Partner
          </Button>
        </Link>
      </div>

      <Tabs items={tabItems} value={tab} onChange={setTab} />

      {tab === "scan" && <ScanSection brandId={user?.brand_id} />}
      {tab === "generate" && <QrGeneratorSection />}
      {tab === "dashboard" && (
        <DashboardSection dashboard={dashboard} loading={loading} error={error} />
      )}
    </div>
  );
}

/** Ticket dashboard showing available vs checked-in (filtered by partner brand) */
function DashboardSection({
  dashboard,
  loading,
  error,
}: {
  dashboard: TicketDashboardSummary[];
  loading: boolean;
  error?: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-tertiary">Memuat data tiket...</p>
      </div>
    );
  }

  if (error) {
    return <div className="py-12 text-center text-destructive-text">Gagal memuat dashboard: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {dashboard.map((summary) => {
        const soldPercent =
          summary.total_tickets > 0
            ? Math.round((summary.sold_tickets / summary.total_tickets) * 100)
            : 0;
        const checkedInPercent =
          summary.sold_tickets > 0
            ? Math.round(
                (summary.checked_in_tickets / summary.sold_tickets) * 100,
              )
            : 0;

        return (
          <Card key={summary.event_id} padding="md">
            <h3 className="text-text-primary font-semibold mb-4">
              {summary.event_name}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Total
                </p>
                <p className="text-text-primary text-xl font-bold mt-1">
                  {summary.total_tickets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Tersedia
                </p>
                <p className="text-success-text text-xl font-bold mt-1">
                  {summary.available_tickets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Terjual
                </p>
                <p className="text-brand-primary text-xl font-bold mt-1">
                  {summary.sold_tickets.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-tertiary text-xs uppercase tracking-wide">
                  Check-in
                </p>
                <p className="text-warning-default text-xl font-bold mt-1">
                  {summary.checked_in_tickets.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress bars */}
            <div className="mt-4 space-y-2">
              <div>
                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                  <span>Terjual</span>
                  <span>{soldPercent}%</span>
                </div>
                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-primary rounded-full transition-all"
                    style={{ width: `${soldPercent}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                  <span>Checked-in (dari terjual)</span>
                  <span>{checkedInPercent}%</span>
                </div>
                <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-default rounded-full transition-all"
                    style={{ width: `${checkedInPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      {dashboard.length === 0 && (
        <div className="text-center py-12 text-text-tertiary">
          <p>Belum ada data tiket untuk brand Anda</p>
        </div>
      )}
    </div>
  );
}
