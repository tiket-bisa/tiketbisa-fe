import { Outlet } from "react-router";
import { NavbarExternal } from "~/shared/components";
import { Footer } from "~/shared/components";

/**
 * External Layout — Public Platform (tiketbisa.com)
 *
 * Structure: NavbarExternal → <Outlet /> → Footer
 * Nav items: Beranda, Event, Brand, Tentang, Hubungi Kami
 */
export default function ExternalLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <NavbarExternal />
      <main className="flex-1 bg-white text-text-primary" data-theme="light">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
