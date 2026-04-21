import { Link } from "react-router";
import { SocialLinks } from "~/core/design-system/components/social-links";
import type { SocialLink } from "~/core/design-system/components/social-links";

export interface FooterProps {
  socialLinks?: SocialLink[];
  className?: string;
}

const footerColumns = [
  {
    title: "Tiketbisa",
    links: [
      { label: "Tentang Kami", to: "/tentang" },
      { label: "Karir", to: "#" },
      { label: "Blog", to: "#" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "FAQ", to: "#" },
      { label: "Hubungi Kami", to: "/hubungi" },
      { label: "Syarat & Ketentuan", to: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Kebijakan Privasi", to: "#" },
      { label: "Ketentuan Layanan", to: "#" },
    ],
  },
  {
    title: "Partner",
    links: [
      { label: "Daftarkan Event", to: "/internal-tb/partner/login" },
      { label: "Partner Login", to: "/internal-tb/partner/login" },
    ],
  },
] as const;

export function Footer({ socialLinks = [], className = "" }: FooterProps) {
  return (
    <footer
      className={`border-t border-border-default bg-surface-primary ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 items-start">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <img
              src="/logo/tiketbisa-white.png"
              alt="Tiketbisa"
              className="block h-auto w-36 lg:w-56 cursor-pointer -mt-1"
            />
            <p className="mt-2 text-sm text-text-tertiary">
              Platform tiket event terpercaya di Indonesia.
            </p>
            {socialLinks.length > 0 && (
              <SocialLinks links={socialLinks} size="sm" className="mt-4" />
            )}
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-text-primary">
                {col.title}
              </h3>
              <ul className="mt-3 flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-divider pt-6 text-center">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} Tiketbisa. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
