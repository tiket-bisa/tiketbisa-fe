import { Link, useLocation } from "react-router";
import { SearchInput } from "~/core/design-system/components";

export interface NavbarExternalProps {
  className?: string;
}

const navLinks = [
  { to: "/", label: "Beranda" },
  { to: "/explore", label: "Explore Event" },
  { to: "/tentang", label: "Tentang" },
  { to: "/hubungi", label: "Hubungi Kami" },
] as const;

export function NavbarExternal({ className = "" }: NavbarExternalProps) {
  const location = useLocation();

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border-default bg-[#1a1245] ${className}`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="shrink-0" aria-label="Tiketbisa home">
          <img
            src="/logo/tiketbisa-white.png"
            alt="Tiketbisa"
            className="w-auto h-8 lg:h-12 cursor-pointer"
          />
        </Link>

        {/* Search */}
        <div className="hidden flex-1 sm:block sm:max-w-xs">
          <SearchInput placeholder="Cari event…" />
        </div>

        {/* Nav links */}
        <ul className="hidden md:flex items-center gap-1 ml-auto">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-brand-primary/20"
                      : "text-text-secondary hover:text-white hover:bg-white/10"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile menu button */}
        <button
          type="button"
          className="ml-auto md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </nav>
    </header>
  );
}
