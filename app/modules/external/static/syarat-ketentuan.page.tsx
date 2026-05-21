/** External — Syarat & Ketentuan (Static) */
export default function SyaratKetentuanPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl">
          Syarat & <span className="text-brand-primary">Ketentuan</span>
        </h1>
        <p className="mt-6 mx-auto max-w-2xl text-lg text-text-secondary leading-relaxed">
          Aturan dan ketentuan penggunaan layanan TiketBisa.
        </p>
      </div>

      {/* Content Section */}
      <div className="border-t border-divider pt-16">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg prose-brand max-w-none text-text-secondary">
            <p className="mb-6">
              Dengan menggunakan layanan TiketBisa, pengguna dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.
            </p>
            <p className="mb-6">
              Seluruh transaksi tiket yang dilakukan melalui platform TiketBisa bersifat sah dan mengikat sesuai ketentuan event yang diselenggarakan oleh masing-masing penyelenggara.
            </p>
            <p className="mb-6">
              Pengguna bertanggung jawab atas kerahasiaan akun dan data pribadi yang digunakan saat melakukan transaksi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
