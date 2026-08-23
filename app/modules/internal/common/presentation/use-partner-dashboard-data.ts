import { useEffect, useMemo, useState } from "react";
import { ApiRequestError, toUserFacingError } from "~/core/api";
import type { EventSummary, RevenueDataPoint, TicketDashboardSummary } from "~/core/types";
import {
  findPartnerBrand,
  getEventsByBrandId,
  getTicketCategoriesByEventId,
  type InternalBrandDto,
  type InternalEventDto,
  type InternalTicketCategoryDto,
} from "../infrastructure/partner.api";

interface UsePartnerDashboardDataOptions {
  brandName?: string;
  brandSlug?: string;
}

interface PartnerDataState {
  isLoading: boolean;
  error: string | null;
  brand: InternalBrandDto | null;
  events: InternalEventDto[];
  categoriesByEvent: Record<string, InternalTicketCategoryDto[]>;
}

interface RevenueByEventItem {
  event_name: string;
  revenue: number;
  tickets_sold: number;
}

interface TicketsByCategoryItem {
  category: string;
  quantity: number;
  revenue: number;
}

interface PartnerDashboardDataResult {
  isLoading: boolean;
  error: string | null;
  brand: InternalBrandDto | null;
  eventSummaries: EventSummary[];
  ticketDashboardSummaries: TicketDashboardSummary[];
  totalRevenue: number;
  totalTicketsSold: number;
  totalTransactions: number | null;
  revenueByEvent: RevenueByEventItem[];
  ticketsByCategory: TicketsByCategoryItem[];
  revenueTimeline: RevenueDataPoint[];
  maxRevenue: number;
}

const initialState: PartnerDataState = {
  isLoading: false,
  error: null,
  brand: null,
  events: [],
  categoriesByEvent: {},
};

function toSafeNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateLabel(input?: string | null): string {
  if (!input) return "-";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTimeLabel(input?: string | null): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return `${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} WIB`;
}

function toEventStatus(event: InternalEventDto): EventSummary["status"] {
  const normalizedStatus = event.status?.trim().toUpperCase();
  if (normalizedStatus === "ENDED") {
    return "completed";
  }
  if (event.isPublished) {
    return "published";
  }
  return "draft";
}

export function usePartnerDashboardData(
  options: UsePartnerDashboardDataOptions,
): PartnerDashboardDataResult {
  const [state, setState] = useState<PartnerDataState>(initialState);

  useEffect(() => {
    const brandName = options.brandName?.trim();
    const brandSlug = options.brandSlug?.trim();

    if (!brandName && !brandSlug) {
      setState(initialState);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    async function fetchPartnerData() {
      try {
        const brand = await findPartnerBrand({ brandName, brandSlug });
        if (!brand) {
          throw new ApiRequestError("Brand partner tidak ditemukan.");
        }

        const events = await getEventsByBrandId(brand.id);
        const categoriesEntries = await Promise.all(
          events.map(async (event) => {
            const categories = await getTicketCategoriesByEventId(event.id);
            return [event.id, categories] as const;
          }),
        );

        if (cancelled) return;

        setState({
          isLoading: false,
          error: null,
          brand,
          events,
          categoriesByEvent: Object.fromEntries(categoriesEntries),
        });
      } catch (error) {
        if (cancelled) return;

        setState({
          isLoading: false,
          error: toUserFacingError(error, "Data partner belum dapat dimuat. Coba muat ulang."),
          brand: null,
          events: [],
          categoriesByEvent: {},
        });
      }
    }

    void fetchPartnerData();

    return () => {
      cancelled = true;
    };
  }, [options.brandName, options.brandSlug]);

  const eventSummaries = useMemo<EventSummary[]>(() => {
    return state.events.map((event) => ({
      id: event.id,
      name: event.name,
      brand: state.brand?.name ?? "-",
      brand_slug: options.brandSlug,
      description: event.description ?? "-",
      image_url: event.bannerPath ?? undefined,
      date: formatDateLabel(event.startDate),
      location: event.venue ?? event.location ?? event.city ?? undefined,
      time: formatTimeLabel(event.startDate),
      status: toEventStatus(event),
    }));
  }, [state.events, state.brand?.name, options.brandSlug]);

  const ticketDashboardSummaries = useMemo<TicketDashboardSummary[]>(() => {
    return state.events.map((event) => {
      const categories = state.categoriesByEvent[event.id] ?? [];
      const totalTickets = categories.reduce(
        (sum, category) => sum + toSafeNumber(category.totalTicket),
        0,
      );
      const soldTickets = categories.reduce(
        (sum, category) => sum + toSafeNumber(category.issuedTicket),
        0,
      );
      const checkedInTickets = categories.reduce(
        (sum, category) => sum + toSafeNumber(category.checkedInTicket),
        0,
      );

      return {
        event_id: event.id,
        event_name: event.name,
        brand_slug: options.brandSlug,
        total_tickets: totalTickets,
        sold_tickets: soldTickets,
        checked_in_tickets: checkedInTickets,
        available_tickets: Math.max(totalTickets - soldTickets, 0),
      };
    });
  }, [state.events, state.categoriesByEvent, options.brandSlug]);

  const revenueByEvent = useMemo<RevenueByEventItem[]>(() => {
    return state.events
      .map((event) => {
        const categories = state.categoriesByEvent[event.id] ?? [];
        const revenue = categories.reduce(
          (sum, category) =>
            sum + toSafeNumber(category.price) * toSafeNumber(category.issuedTicket),
          0,
        );
        const soldTickets = categories.reduce(
          (sum, category) => sum + toSafeNumber(category.issuedTicket),
          0,
        );

        return {
          event_name: event.name,
          revenue,
          tickets_sold: soldTickets,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [state.events, state.categoriesByEvent]);

  const ticketsByCategory = useMemo<TicketsByCategoryItem[]>(() => {
    const map: Record<string, TicketsByCategoryItem> = {};

    for (const categories of Object.values(state.categoriesByEvent)) {
      for (const category of categories) {
        const key = category.name || "Tanpa Kategori";
        if (!map[key]) {
          map[key] = {
            category: key,
            quantity: 0,
            revenue: 0,
          };
        }

        const issued = toSafeNumber(category.issuedTicket);
        map[key].quantity += issued;
        map[key].revenue += issued * toSafeNumber(category.price);
      }
    }

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [state.categoriesByEvent]);

  const revenueTimeline = useMemo<RevenueDataPoint[]>(() => {
    const eventById = new Map(state.events.map((event) => [event.id, event]));
    const map: Record<string, RevenueDataPoint> = {};

    for (const summary of ticketDashboardSummaries) {
      const event = eventById.get(summary.event_id);
      const dateKey = event?.startDate?.slice(0, 10);
      if (!dateKey) continue;

      const eventRevenue =
        (state.categoriesByEvent[summary.event_id] ?? []).reduce(
          (sum, category) =>
            sum + toSafeNumber(category.price) * toSafeNumber(category.issuedTicket),
          0,
        );

      if (!map[dateKey]) {
        map[dateKey] = {
          date: dateKey,
          revenue: 0,
          transactions: 0,
        };
      }

      map[dateKey].revenue += eventRevenue;
      map[dateKey].transactions += summary.sold_tickets;
    }

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [state.events, state.categoriesByEvent, ticketDashboardSummaries]);

  const totalRevenue = useMemo(
    () => revenueByEvent.reduce((sum, item) => sum + item.revenue, 0),
    [revenueByEvent],
  );
  const totalTicketsSold = useMemo(
    () => revenueByEvent.reduce((sum, item) => sum + item.tickets_sold, 0),
    [revenueByEvent],
  );
  const maxRevenue = useMemo(
    () => Math.max(...revenueTimeline.map((item) => item.revenue), 1),
    [revenueTimeline],
  );

  return {
    isLoading: state.isLoading,
    error: state.error,
    brand: state.brand,
    eventSummaries,
    ticketDashboardSummaries,
    totalRevenue,
    totalTicketsSold,
    totalTransactions: null,
    revenueByEvent,
    ticketsByCategory,
    revenueTimeline,
    maxRevenue,
  };
}
