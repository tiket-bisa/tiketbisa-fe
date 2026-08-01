import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { SearchInput } from "~/core/design-system/components";

export interface NavbarExternalProps {
  className?: string;
}

const navLinks = [
  { to: "/", label: "Beranda" },
  { to: "/event", label: "Event" },
  { to: "/brand", label: "Brand" },
  { to: "/tentang", label: "Tentang" },
  { to: "/hubungi", label: "Hubungi Kami" },
] as const;

export function NavbarExternal({ className = "" }: NavbarExternalProps) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <header className={`sticky top-0 z-50 border-b border-border-default bg-[#1a1245] text-text-primary ${className}`}>
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0" aria-label="Tiketbisa home" onClick={() => setIsMenuOpen(false)}>
          <img
            src="/logo/tiketbisa-white.png"
            alt="Tiketbisa"
            className="w-auto h-7 lg:h-9 cursor-pointer"
          />
        </Link>

        <div className="hidden flex-1 px-8 sm:block sm:max-w-md">
          <SearchInput placeholder="Cari event…" />
        </div>

        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.to);

            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand-primary/20 text-text-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/10"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-[60] bg-[#0f0b1f] transition-all duration-300 md:hidden ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <img src="/logo/tiketbisa-white.png" alt="Tiketbisa" className="w-auto h-7" />
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-6 sm:px-6 space-y-8 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] px-3">
              Cari Event
            </p>
            <SearchInput placeholder="Mau nonton apa hari ini?" className="w-full !bg-white/5" />
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em] px-3 mb-4">
              Menu Navigasi
            </p>
            <ul className="space-y-2">
              {navLinks.map((link) => {
                const isActive =
                  link.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.to);

                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-4 py-4 text-lg font-semibold transition-all ${
                        isActive
                          ? "bg-brand-primary text-base-white shadow-[0_0_20px_rgba(109,92,255,0.3)]"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                      }`}
                    >
                      <span>{link.label}</span>
                      <svg className={`h-5 w-5 transition-transform ${isActive ? "translate-x-0" : "-translate-x-2 opacity-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-text-tertiary">
              © 2026 Tiketbisa. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
