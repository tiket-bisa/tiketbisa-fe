import { Outlet } from "react-router";

/**
 * Internal Layout — Partner Dashboard ([subdomain].tiketbisa.com)
 *
 * Structure: Header (partner nav + Scan Tiket CTA) → <Outlet /> → Footer
 * Nav items: Pilih Brand, Beranda, Event, Analitik
 * Action: "Scan Tiket" button
 *
 * TODO: Implement AuthProvider + AuthGuard wrapper
 * TODO: Implement InternalHeader, InternalFooter
 */
export default function InternalLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: <AuthProvider> + <AuthGuard> */}
      {/* TODO: <InternalHeader /> */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      {/* TODO: <InternalFooter /> */}
    </div>
  );
}
