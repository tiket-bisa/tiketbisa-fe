import { Outlet } from "react-router";
import { NavbarExternal } from "~/shared/components";
import { Footer } from "~/shared/components";
import { RouteProgress } from "~/shared/components/route-progress";

/**
 * External Layout — Public Platform (tiketbisa.com)
 *
 * Structure: NavbarExternal → <Outlet /> → Footer
 * Nav items: Beranda, Event, Brand, Tentang, Hubungi Kami
 */
export default function ExternalLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <RouteProgress />
      <NavbarExternal />
      <main className="flex-1 bg-white text-text-primary" data-theme="light">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
