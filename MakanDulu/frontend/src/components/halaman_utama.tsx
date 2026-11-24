import React from 'react';
import { LOGO_URL } from '../data/dataMock';

interface HalamanUtamaProps {
  onSelectRole: (role: 'Pembeli' | 'Penjual') => void;
  onOpenPortalModal?: () => void;
}

export const HalamanPilihPeran: React.FC<HalamanUtamaProps> = ({ onSelectRole }) => {
 return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827] flex flex-col">
      {/* Top Announcement Bar */}
      <div className="w-full bg-[#c24d0a] text-white py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold tracking-[0.14em] uppercase text-center">
          <span className="material-symbols-outlined text-[15px] leading-none">
            bolt
          </span>
          <span>MAKANDULU ECOSYSTEM • SILAKAN TENTUKAN PERAN ANDA TERLEBIH DAHULU</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12">
        {/* Brand & Header */}
        <div className="max-w-2xl w-full text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#c24d0a] text-white flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">
                room_service
              </span>
            </div>
            <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#0f172a]">
              Makan<span className="text-[#0f172a]">Dulu</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-[40px] font-extrabold tracking-tight text-[#0f172a] leading-tight mb-3">
            Pilih Peran Anda untuk Memulai
          </h1>

          <p className="text-sm sm:text-base text-[#64748b] leading-relaxed max-w-xl mx-auto">
            Tentukan identitas akses di platform MakanDulu. Anda akan diarahkan langsung ke
            antarmuka kerja sesuai peran yang dipilih.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-7 items-stretch">
          {/* Card 1: Pembeli */}
          <section className="bg-white rounded-3xl border border-[#e2e8f0] p-7 sm:p-9 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between transition-all duration-200 hover:border-[#fdba74] hover:shadow-[0_18px_40px_-14px_rgba(194,77,10,0.14)]">
            <div>
              {/* Top Icon & Badge */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#fde8dc] text-[#c24d0a] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">
                    ramen_dining
                  </span>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#fde8dc] text-[#c24d0a] text-[11px] font-bold tracking-wider uppercase">
                  KONSUMEN
                </span>
              </div>
              
              <h2 className="text-2xl font-extrabold text-[#0f172a] mb-3">
                Masuk Sebagai Pembeli
              </h2>

              {/* Description */}
              <p className="text-sm text-[#64748b] leading-relaxed mb-7">
                Jelajahi aneka kuliner lezat, pilih makanan sesuai selera rasa, masukkan ke
                keranjang kasir terintegrasi, dan lacak kurir di halaman Live Tracking setelah
                pesanan dibuat.
              </p>

              <hr className="border-[#f1f5f9] mb-6" />

              {/* Features List */}
              <ul className="space-y-3.5 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-[#334155]">
                  <span className="material-symbols-outlined text-[20px] text-[#16a34a] shrink-0">
                    check_circle
                  </span>
                  <span>Katalog Menu &amp; Rekomendasi Selera</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#334155]">
                  <span className="material-symbols-outlined text-[20px] text-[#16a34a] shrink-0">
                    check_circle
                  </span>
                  <span>Keranjang &amp; Kasir Checkout Terintegrasi</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#334155]">
                  <span className="material-symbols-outlined text-[20px] text-[#16a34a] shrink-0">
                    check_circle
                  </span>
                  <span>Live Tracking Kurir (Aktif Setelah Checkout)</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => onSelectRole('Pembeli')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#a84300] hover:bg-[#8c3700] active:scale-[0.99] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
            >
              <span>Masuk Sebagai Pembeli</span>
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
          </section>

          {/* Card 2: Penjual */}
          <section className="bg-white rounded-3xl border border-[#e2e8f0] p-7 sm:p-9 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.08)] flex flex-col justify-between transition-all duration-200 hover:border-[#fcd34d] hover:shadow-[0_18px_40px_-14px_rgba(120,66,0,0.14)]">
            <div>
              {/* Top Icon & Badge */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#fef0d8] text-[#8a5300] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">
                    storefront
                  </span>
                </div>

                <span className="px-3 py-1 rounded-full bg-[#fef0d8] text-[#8a5300] text-[11px] font-bold tracking-wider uppercase">
                  MITRA USAHA
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0f172a] mb-3">
                Masuk Sebagai Penjual
              </h2>

              {/* Description */}
              <p className="text-sm text-[#64748b] leading-relaxed mb-7">
                Kelola operasional restoran, pantau antrean pesanan masuk dengan hitung mundur
                timer 10 menit, serta analisa omzet penjualan harian dan stok menu.
              </p>

              <hr className="border-[#f1f5f9] mb-6" />

              {/* Features List */}
              <ul className="space-y-3.5 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-[#334155]">
                  <span className="material-symbols-outlined text-[20px] text-[#854d0e] shrink-0">
                    check_circle
                  </span>
                  <span>Menu Antrean Pesanan (Timer 10 Menit)</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#334155]">
                  <span className="material-symbols-outlined text-[20px] text-[#854d0e] shrink-0">
                    check_circle
                  </span>
                  <span>Dashboard Merchant &amp; Analitik Omzet</span>
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#334155]">
                  <span className="material-symbols-outlined text-[20px] text-[#854d0e] shrink-0">
                    check_circle
                  </span>
                  <span>Manajemen Ketersediaan Stok Menu Warung</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={() => onSelectRole('Penjual')}
              className="w-full py-3.5 px-6 rounded-xl bg-[#7a4100] hover:bg-[#613300] active:scale-[0.99] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm"
            >
              <span>Masuk Sebagai Penjual</span>
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HalamanPilihPeran;
