import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Button } from "~/core/design-system/components";

interface ScannerNavbarProps {
  identifier?: string;
  brandName?: string;
  onLogout?: () => void;
  onScanTicket?: () => void;
}

export function ScannerNavbar({
  identifier,
  brandName,
  onLogout,
  onScanTicket,
}: ScannerNavbarProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-surface-primary/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/internal-tb/scanner" className="shrink-0" aria-label="Tiketbisa scanner">
          <img
            src="/logo/tiketbisa-white.png"
            alt="Tiketbisa"
            className="h-8 w-auto lg:h-10"
          />
        </Link>

        <span className="hidden sm:inline-flex items-center rounded-md bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning-text">
          Scanner
        </span>

        {brandName && (
          <span className="hidden md:inline-flex items-center rounded-md bg-surface-hover px-2 py-0.5 text-xs font-medium text-text-secondary">
            {brandName}
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          {onScanTicket && (
            <Button
              variant={location.pathname === "/internal-tb/scanner/scan" ? "primary" : "secondary"}
              size="sm"
              onClick={onScanTicket}
            >
              Scan Ticket
            </Button>
          )}

          {identifier && (
            <span className="hidden sm:block max-w-[180px] truncate text-xs text-text-tertiary">
              {identifier}
            </span>
          )}

          {onLogout && (
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Keluar
            </Button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-border-default bg-surface-primary px-4 py-4 md:hidden">
          <div className="space-y-3">
            {identifier && <p className="text-xs text-text-tertiary">{identifier}</p>}
            {brandName && <p className="text-xs font-medium text-text-secondary">{brandName}</p>}
            {onScanTicket && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onScanTicket();
                }}
                className="w-full justify-center"
              >
                Scan Ticket
              </Button>
            )}
            {onLogout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full justify-center"
              >
                Keluar
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
