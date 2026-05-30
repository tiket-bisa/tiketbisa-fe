/** External — Kebijakan Privasi (Static) */
export default function KebijakanPrivasiPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          Kebijakan <span className="text-brand-primary">Privasi</span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-lg text-text-secondary leading-relaxed">
          Komitmen kami dalam menjaga dan melindungi data pribadi Anda.
        </p>
      </div>

      {/* Content Section */}
      <div className="border-t border-divider pt-16">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg prose-brand max-w-none text-text-secondary">
            <p className="mb-6">
              TiketBisa berkomitmen untuk menjaga dan melindungi seluruh data pribadi pengguna.
            </p>
            <p className="mb-6">
              Informasi yang dikumpulkan hanya digunakan untuk keperluan transaksi, verifikasi, peningkatan layanan, dan kebutuhan operasional lainnya sesuai ketentuan yang berlaku.
            </p>
            <p className="mb-6">
              TiketBisa tidak akan membagikan data pribadi pengguna kepada pihak lain tanpa persetujuan pengguna, kecuali diwajibkan oleh hukum.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
