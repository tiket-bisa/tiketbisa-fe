/** External — Ketentuan Layanan (Static) */
export default function KetentuanLayananPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          Ketentuan <span className="text-brand-primary">Layanan</span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-lg text-text-secondary leading-relaxed">
          Ketentuan dalam menggunakan platform TiketBisa secara bijak.
        </p>
      </div>

      {/* Content Section */}
      <div className="border-t border-divider pt-16">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg prose-brand max-w-none text-text-secondary">
            <p className="mb-6">
              Pengguna wajib menggunakan platform TiketBisa secara bijak dan sesuai dengan hukum yang berlaku.
            </p>
            <p className="mb-6">
              TiketBisa berhak melakukan pembatalan transaksi, penangguhan akun, atau tindakan lainnya apabila ditemukan aktivitas yang melanggar ketentuan layanan maupun indikasi penyalahgunaan platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
