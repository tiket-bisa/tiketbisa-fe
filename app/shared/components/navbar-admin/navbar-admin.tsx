import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "~/core/design-system/components";

export interface NavbarAdminProps {
  userEmail?: string;
  onLogout?: () => void;
  onScanTicket?: () => void;
  className?: string;
}

const navLinks: readonly { to: string; label: string; exact?: boolean }[] = [
  { to: "/internal-tb/admin", label: "Beranda", exact: true },
  { to: "/internal-tb/admin/brands", label: "Brand" },
  { to: "/internal-tb/admin/events", label: "Event" },
  { to: "/internal-tb/admin/analytics", label: "Analitik" },
  { to: "/internal-tb/admin/integration-clients", label: "Integrasi" },
];

export function NavbarAdmin({
  userEmail,
  onLogout,
  onScanTicket,
  className = "",
}: NavbarAdminProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border-default bg-surface-primary/95 backdrop-blur-sm ${className}`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/internal-tb/admin"
          className="shrink-0"
          aria-label="Tiketbisa admin"
        >
          <img
            src="/logo/tiketbisa.png"
            alt="Tiketbisa"
            className="w-auto h-8 lg:h-10 cursor-pointer"
          />
        </Link>

        {/* Admin badge */}
        <span className="hidden sm:inline-flex items-center rounded-md bg-brand-primary-subtle px-2 py-0.5 text-xs font-medium text-brand-primary">
          Admin
        </span>

        {/* Nav links */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? location.pathname === link.to
              : location.pathname.startsWith(link.to);
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
          {onScanTicket && (
            <Button variant="secondary" size="sm" onClick={onScanTicket}>
              Scan Tiket
            </Button>
          )}

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
          onClick={toggleMobileMenu}
          className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border-default bg-surface-primary animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-brand-primary bg-brand-primary/5"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="border-t border-border-subtle my-2" />

            {userEmail && (
              <div className="px-3 py-2">
                <p className="text-xs text-text-tertiary truncate">{userEmail}</p>
                <p className="text-xs text-text-secondary font-medium mt-0.5">Admin</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              {onScanTicket && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    closeMobileMenu();
                    onScanTicket();
                  }}
                  className="w-full justify-center"
                >
                  Scan Tiket
                </Button>
              )}
              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    closeMobileMenu();
                    onLogout();
                  }}
                  className="w-full justify-center"
                >
                  Keluar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
