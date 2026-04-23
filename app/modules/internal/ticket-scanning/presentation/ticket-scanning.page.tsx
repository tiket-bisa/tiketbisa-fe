import { useState } from "react";
import { Card, Tabs } from "~/core/design-system/components";
import { useAuth } from "~/core/auth";
import { useApiQuery } from "~/core/api";
import { eventApi } from "~/core/api/services/event.api";
import { brandApi, mapBrandApiToFe } from "~/core/api/services/brand.api";
import {
  ticketCategoryApi,
  aggregateTicketDashboard,
} from "~/core/api/services/ticket-category.api";
import type { TicketDashboardSummary } from "~/core/types";
import { ScanSection, QrGeneratorSection } from "./components";

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
  const { data: ticketDashboard, loading } = useApiQuery(
    async () => {
      // Resolve brand ID
      const brandsRes = await brandApi.getList({ limit: 100, offset: 0 });
      if (!brandsRes.success || !brandsRes.data) return [] as TicketDashboardSummary[];
      let brandId: string | null = null;
      let brandSlug: string | undefined;
      for (const b of brandsRes.data.brands ?? []) {
        const fe = mapBrandApiToFe(b);
        if (fe.slug === user?.brand_slug) {
          brandId = b.id;
          brandSlug = fe.slug;
          break;
        }
      }
      if (!brandId) return [] as TicketDashboardSummary[];

      // Fetch events for this brand
      const eventsRes = await eventApi.getList({ limit: 100, offset: 0, brandId });
      if (!eventsRes.success || !eventsRes.data) return [] as TicketDashboardSummary[];

      const summaries: TicketDashboardSummary[] = [];
      for (const evt of eventsRes.data.events ?? []) {
        const catRes = await ticketCategoryApi.getByEvent(evt.id);
        if (catRes.success && catRes.data) {
          const categories = Array.isArray(catRes.data) ? catRes.data : [];
          if (categories.length > 0) {
            summaries.push(
              aggregateTicketDashboard(evt.id, evt.name, categories, brandSlug),
            );
          }
        }
      }
      return summaries;
    },
    [user?.brand_slug],
  );

  const dashboard = ticketDashboard ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-text-primary text-2xl font-bold">Scan Tiket</h1>

      <Tabs items={tabItems} value={tab} onChange={setTab} />

      {tab === "scan" && <ScanSection />}
      {tab === "generate" && <QrGeneratorSection />}
      {tab === "dashboard" && (
        <DashboardSection dashboard={dashboard} loading={loading} />
      )}
    </div>
  );
}

/** Ticket dashboard showing available vs checked-in (filtered by partner brand) */
function DashboardSection({
  dashboard,
  loading,
}: {
  dashboard: TicketDashboardSummary[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-text-tertiary">Memuat data tiket...</p>
      </div>
    );
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