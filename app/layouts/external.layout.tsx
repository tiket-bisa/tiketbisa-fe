import { Outlet } from "react-router";

/**
 * External Layout — Public Platform (tiketbisa.com)
 *
 * Structure: Header (search bar + nav) → <Outlet /> → Footer
 * Nav items: Beranda, Explore Event, Tentang, Hubungi Kami
 *
 * TODO: Implement Header, Footer, and mobile nav
 */
export default function ExternalLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: <ExternalHeader /> */}
      <main className="flex-1">
        <Outlet />
      </main>
      {/* TODO: <ExternalFooter /> */}
    </div>
  );
}
