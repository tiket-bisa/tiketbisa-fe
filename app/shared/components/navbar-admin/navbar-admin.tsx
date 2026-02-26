import { Link, useLocation } from "react-router";
import { Button } from "~/core/design-system/components";

export interface NavbarAdminProps {
  userEmail?: string;
  onLogout?: () => void;
  className?: string;
}

const navLinks = [
  { to: "/partner/brands", label: "Pilih Brand" },
  { to: "/partner/access", label: "Konfigurasi Akses" },
] as const;

export function NavbarAdmin({
  userEmail,
  onLogout,
  className = "",
}: NavbarAdminProps) {
  const location = useLocation();

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border-default bg-surface-primary/95 backdrop-blur-sm ${className}`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/partner/brands"
          className="shrink-0"
          aria-label="Tiketbisa admin"
        >
          <img
            src="/logo/tiketbisa-white.png"
            alt="Tiketbisa"
            className="w-auto h-8 lg:h-10 cursor-pointer"
          />
        </Link>

        {/* Nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-brand-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-3">
          {userEmail && (
            <span className="hidden sm:block text-xs text-text-tertiary truncate max-w-[180px]">
              {userEmail}
            </span>
          )}

          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Keluar
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
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
