export function ImportantGuides() {
  return (
    <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
      <h3 className="text-xs font-black text-text-tertiary mb-4 uppercase tracking-[0.2em]">Panduan Penting</h3>
      <ul className="space-y-4">
        {[
          "Pastikan email aktif untuk pengiriman E-Tiket.",
          "Nama dan NIK harus sesuai KTP.",
          "E-Tiket akan dikirim maksimal 15 menit setelah pembayaran."
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
            <p className="text-sm font-bold text-text-secondary leading-relaxed">{text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OrderEmailNotice() {
  return (
    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-xs font-bold text-text-secondary leading-relaxed">
          Salinan tiket juga telah kami kirimkan ke alamat email Anda. Silakan periksa folder kotak masuk atau spam.
        </p>
      </div>
    </div>
  );
}
