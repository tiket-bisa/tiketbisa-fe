import { useNavigate } from "react-router";

export function CheckoutComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-white">
      <div className="p-8 bg-gray-50 rounded-full mb-8">
         <svg className="h-16 w-16 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <h2 className="text-3xl font-black text-text-primary mb-2">Segera Hadir</h2>
      <p className="text-text-secondary font-medium mb-10 max-w-sm">Tahapan ini sedang dalam proses pengembangan oleh tim kami.</p>
      <button 
        onClick={() => navigate(-1)}
        className="px-8 py-3 bg-brand-primary font-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
      >
        Kembali ke Detail Pesanan
      </button>
    </div>
  );
}
