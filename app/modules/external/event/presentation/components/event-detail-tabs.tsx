import { Link } from "react-router";
import { Avatar, Tabs } from "~/core/design-system/components";
import { TicketRow } from "~/shared/components";
import type { Event } from "../../domain/event.entity";

interface EventDetailTabsProps {
  event: Event;
  activeTab: string;
  onTabChange: (val: string) => void;
  quantities: Record<string, number>;
  onQuantityChange: (id: string, qty: number) => void;
}

export function EventDetailTabs({
  event,
  activeTab,
  onTabChange,
  quantities,
  onQuantityChange,
}: EventDetailTabsProps) {
  const tabItems = [
    { label: "Deskripsi", value: "deskripsi" },
    {
      label: "Tiket",
      value: "tiket",
      count: event.tickets.filter((t) => t.available).length,
    },
    { label: "Syarat & Ketentuan", value: "syarat" },
  ];

  return (
    <div className="lg:col-span-2 space-y-8">
      <div className="sticky top-16 z-20 bg-surface-primary/80 backdrop-blur-md pt-2 border-b border-border-subtle">
        <Tabs items={tabItems} value={activeTab} onChange={onTabChange} />
      </div>

      <main className="mt-8 transition-all duration-300">
        {activeTab === "deskripsi" && (
          <article className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full aspect-video rounded-2xl object-cover shadow-2xl border border-border-default"
            />
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Tentang Event
              </h2>
              <p className="text-text-secondary leading-relaxed text-lg">
                {event.description}
              </p>
            </div>
          </article>
        )}

        {activeTab === "tiket" && (
          <section className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-text-primary">Kategori Tiket</h2>
            <div className="grid gap-4">
              {event.tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  quantity={quantities[ticket.id] || 0}
                  onQuantityChange={onQuantityChange}
                />
              ))}
            </div>
          </section>
        )}

        {activeTab === "syarat" && (
          <section className="bg-surface-alt p-8 rounded-2xl border border-border-default animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              Syarat & Ketentuan
            </h2>
            <ul className="space-y-4">
              {event.terms?.map((term, idx) => (
                <li
                  key={idx}
                  className="flex gap-4 text-text-primary text-lg"
                >
                  <span className="text-brand-primary font-bold">
                    {idx + 1}.
                  </span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <footer className="mt-16 pt-8 border-t border-border-default">
        <h2 className="text-xl font-bold text-text-primary mb-6">Penyelenggara</h2>
        <div className="group flex items-center gap-6 p-6 rounded-2xl border border-border-default bg-surface-alt hover:bg-surface-hover transition-colors">
          <Avatar
            src=""
            fallback={event.brand.charAt(0)}
            size="lg"
            className="ring-2 ring-brand-primary text-brand-primary"
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-brand-primary">
              {event.brand}
            </h3>
            <p className="text-text-tertiary text-sm mb-2">
              Verified Partner Tiketbisa
            </p>
            <Link
              to={`/brand/${event.brandId || event.brand.toLowerCase()}`}
              className="text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
            >
              Lihat Profil Brand{" "}
              <span className="material-symbols-outlined text-sm">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
