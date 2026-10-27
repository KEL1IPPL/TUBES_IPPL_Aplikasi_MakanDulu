import React from 'react';
import { LOGO_URL } from '../data/dataMock';

interface RoleSelectionLandingProps {
  onSelectRole: (role: 'Pembeli' | 'Penjual') => void;
  onOpenPortalModal?: () => void;
}

export const RoleSelectionLanding: React.FC<RoleSelectionLandingProps> = ({
  onSelectRole,
  onOpenPortalModal
}) => {
  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-between">
      {/* Top Bar Accent */}
      <div className="bg-[#cc4900] text-[#fffbff] py-1.5 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm leading-none">bolt</span>
          <span className="text-[11px] font-bold tracking-wider uppercase">
            MakanDulu Ecosystem • Silakan Tentukan Peran Anda Terlebih Dahulu
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-5xl flex flex-col items-center">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-3 mb-3">
              <img
                alt="MakanDulu Brand Logo"
                className="h-10 w-auto object-contain"
                src={LOGO_URL}
              />
              <span className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
                MakanDulu
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#111c2d] tracking-tight">
              Pilih Peran Anda untuk Memulai
            </h1>
            <p className="text-xs sm:text-sm text-[#5a4138] mt-2 max-w-xl leading-relaxed">
              Tentukan identitas akses di platform MakanDulu. Anda akan diarahkan langsung ke antarmuka kerja sesuai peran yang dipilih.
            </p>
          </div>

          {/* Dual Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Card 1: Pembeli (Customer) */}
            <div
              onClick={() => onSelectRole('Pembeli')}
              className="group relative cursor-pointer rounded-3xl bg-white p-7 sm:p-8 transition-all duration-300 border-2 border-[#dee8ff] hover:border-[#a33900] shadow-sm hover:shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-3xl">ramen_dining</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#ffdbce] text-[#a33900] text-[11px] font-bold uppercase">
                    Konsumen
                  </span>
                </div>

                <div className="mt-6">
                  <span className="text-[11px] font-mono text-[#5a4138]">ID: ROLE_CUSTOMER</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#111c2d] mt-1 group-hover:text-[#a33900] transition-colors">
                    Masuk Sebagai Pembeli
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5a4138] mt-2 leading-relaxed">
                    Jelajahi aneka kuliner lezat, pilih makanan sesuai selera rasa, masukkan ke keranjang kasir terintegrasi, dan lacak kurir di halaman Live Tracking setelah pesanan dibuat.
                  </p>

                  <div className="mt-5 space-y-2 pt-4 border-t border-[#f0f3ff] text-xs text-[#5a4138]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c49] text-base">check_circle</span>
                      <span>Katalog Menu & Rekomendasi Selera</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c49] text-base">check_circle</span>
                      <span>Keranjang & Kasir Checkout Terintegrasi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c49] text-base">check_circle</span>
                      <span>Live Tracking Kurir (Aktif Setelah Checkout)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => onSelectRole('Pembeli')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#a33900] text-white font-bold text-sm shadow-lg shadow-[#a33900]/20 hover:bg-[#cc4900] transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>Masuk Sebagai Pembeli</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>

            {/* Card 2: Penjual (Merchant) */}
            <div
              onClick={() => onSelectRole('Penjual')}
              className="group relative cursor-pointer rounded-3xl bg-white p-7 sm:p-8 transition-all duration-300 border-2 border-[#dee8ff] hover:border-[#825100] shadow-sm hover:shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-3xl">storefront</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#ffddb8] text-[#825100] text-[11px] font-bold uppercase">
                    Mitra Usaha
                  </span>
                </div>

                <div className="mt-6">
                  <span className="text-[11px] font-mono text-[#5a4138]">ID: ROLE_MERCHANT</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#111c2d] mt-1 group-hover:text-[#825100] transition-colors">
                    Masuk Sebagai Penjual
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5a4138] mt-2 leading-relaxed">
                    Kelola operasional restoran, pantau antrean pesanan masuk dengan hitung mundur timer 10 menit, serta analisa omzet penjualan harian dan stok menu.
                  </p>

                  <div className="mt-5 space-y-2 pt-4 border-t border-[#f0f3ff] text-xs text-[#5a4138]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#825100] text-base">check_circle</span>
                      <span>Menu Antrean Pesanan (Timer 10 Menit)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#825100] text-base">check_circle</span>
                      <span>Dashboard Merchant & Analitik Omzet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#825100] text-base">check_circle</span>
                      <span>Manajemen Ketersediaan Stok Menu Warung</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => onSelectRole('Penjual')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#825100] text-white font-bold text-sm shadow-lg shadow-[#825100]/20 hover:bg-[#a36700] transition-all flex items-center justify-center gap-2 group-hover:gap-3"
                >
                  <span>Masuk Sebagai Penjual</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#f0f3ff] py-6 border-t border-[#dee8ff] text-center text-xs text-[#5a4138]">
        © 2026 MakanDulu Indonesia. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
};

export const HalamanPilihPeran = RoleSelectionLanding;
