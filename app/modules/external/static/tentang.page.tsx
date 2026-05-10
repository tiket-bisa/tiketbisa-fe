import { Card } from "~/core/design-system/components/card";

/** External — Tentang Kami (Static) */
export default function TentangPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          Tentang <span className="text-brand-primary">TiketBisa</span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-lg text-text-secondary leading-relaxed">
          Platform terpercaya untuk menemukan dan memesan tiket event terbaik di Indonesia. Kami menghubungkan jutaan penggemar dengan momen yang tak terlupakan.
        </p>
      </div>

      {/* Vision Section */}
      <div className="border-t border-divider pt-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold text-text-primary mb-6">Visi & Misi Kami</h2>
          <p className="text-text-secondary text-lg leading-relaxed mb-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <p className="text-text-secondary text-lg leading-relaxed">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </div>
    </div>
  );
}
