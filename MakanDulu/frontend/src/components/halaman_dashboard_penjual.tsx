import React, { useState, useEffect } from 'react';
import { MenuItem, UserProfile } from '../types';

interface HalamanDashboardPenjualProps {
  menuList: MenuItem[];
  isStoreOpen: boolean;
  onToggleStoreStatus: () => void;
  onNavigateToMenu: () => void;
  onNavigateToOrders: () => void;
  onNavigateToVoucher: () => void;
  onNavigateToReport: () => void;
  userProfile?: UserProfile | null;
}

const HalamanDashboardPenjual: React.FC<HalamanDashboardPenjualProps> = ({
  menuList,
  isStoreOpen,
  onToggleStoreStatus,
  onNavigateToMenu,
  onNavigateToOrders,
  onNavigateToVoucher,
  onNavigateToReport,
  userProfile
}) => {
  const [timerRemaining, setTimerRemaining] = useState(540); // 9 minutes remaining

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const totalMenu = menuList.length;
  const availableMenu = menuList.filter((m) => m.isAvailable).length;

  return (
    <div className="w-full space-y-6">
      {/* Top Banner & Store Toggle */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full ${isStoreOpen ? 'bg-[#006c49] animate-pulse' : 'bg-[#ba1a1a]'}`} />
            <span className="text-xs font-black uppercase tracking-wider text-[#5a4138]">
              Status Operasional Merchant
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#111c2d]">
            {userProfile?.storeName || 'Resto Mitra'} • {isStoreOpen ? 'Toko Buka' : 'Toko Tutup'}
          </h1>
          <p className="text-xs text-[#5a4138]">
            {isStoreOpen
              ? `${userProfile?.storeName || 'Resto'} sedang aktif menerima pesanan dari pelanggan di ${userProfile?.address || 'sekitar Anda'}.`
              : 'Resto sedang tutup sementara. Pelanggan tidak dapat membuat pesanan baru.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleStoreStatus}
          className={`px-6 py-3.5 rounded-2xl text-xs font-black shadow-md transition-all flex items-center gap-2 active:scale-95 shrink-0 ${
            isStoreOpen
              ? 'bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white border border-[#ffb4ab]'
              : 'bg-[#006c49] text-white hover:bg-[#005236]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {isStoreOpen ? 'store' : 'storefront'}
          </span>
          <span>{isStoreOpen ? 'Tutup Toko Sementara' : 'Buka Toko Sekarang'}</span>
        </button>
      </div>

      {/* Incoming Order Urgent Alert with 10-Minute Timer */}
      <div className="bg-gradient-to-r from-[#fff7f4] via-[#ffede6] to-[#fffbff] border-2 border-[#ffdbce] rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#a33900] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
            <span className="material-symbols-outlined text-2xl animate-spin">alarm</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#a33900] text-white text-[10px] font-black uppercase tracking-wider">
                Pesanan Masuk Baru!
              </span>
              <span className="text-xs font-bold text-[#111c2d]">#MKD-2026-9921</span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-[#111c2d]">
              Siti Rahma • 2x Bebek Bumbu Hitam, 1x Es Jeruk
            </h2>
            <p className="text-xs text-[#5a4138] mt-0.5">
              Konfirmasi segera sebelum batas waktu 10 menit berakhir!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-[10px] text-[#5a4138] font-bold block">Sisa Waktu Konfirmasi:</span>
            <span className="text-xl font-black font-mono text-[#ba1a1a]">
              {formatTimer(timerRemaining)}
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateToOrders}
            className="px-5 py-3 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <span>Tinjau Pesanan</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#dee8ff] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Omzet Hari Ini
          </span>
          <span className="text-2xl font-black text-[#111c2d]">Rp 1.480.000</span>
          <span className="text-[11px] text-[#006c49] font-bold block">▲ +18% dari kemarin</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#dee8ff] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Antrean Pesanan
          </span>
          <span className="text-2xl font-black text-[#825100]">4 Pesanan</span>
          <span className="text-[11px] text-[#5a4138] block">1 Baru, 2 Dimasak, 1 Diantar</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#dee8ff] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Ketersediaan Menu
          </span>
          <span className="text-2xl font-black text-[#111c2d]">
            {availableMenu} / {totalMenu}
          </span>
          <span className="text-[11px] text-[#006c49] font-bold block">
            {totalMenu - availableMenu} menu stok habis
          </span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#dee8ff] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Rating Resto
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-amber-500">★ 4.9</span>
            <span className="text-xs text-[#5a4138]">(500+ ulasan)</span>
          </div>
          <span className="text-[11px] text-[#006c49] font-bold block">Mitra Pilihan Super</span>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div
          onClick={onNavigateToMenu}
          className="cursor-pointer bg-white hover:bg-[#f9f9ff] rounded-3xl p-6 border border-[#dee8ff] hover:border-[#825100] transition-all shadow-sm space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
          </div>
          <h3 className="text-base font-extrabold text-[#111c2d]">Kelola Menu & Stok</h3>
          <p className="text-xs text-[#5a4138] leading-relaxed">
            Tambah hidangan baru, ubah harga promo, dan sesuaikan ketersediaan porsi harian resto.
          </p>
          <span className="text-xs font-bold text-[#825100] flex items-center gap-1 group-hover:gap-2 transition-all">
            <span>Buka Kelola Menu</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>

        <div
          onClick={onNavigateToVoucher}
          className="cursor-pointer bg-white hover:bg-[#f9f9ff] rounded-3xl p-6 border border-[#dee8ff] hover:border-[#825100] transition-all shadow-sm space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">loyalty</span>
          </div>
          <h3 className="text-base font-extrabold text-[#111c2d]">Kelola Voucher Promo</h3>
          <p className="text-xs text-[#5a4138] leading-relaxed">
            Terbitkan kode kupon diskon dan potongan ongkir untuk menarik pelanggan baru.
          </p>
          <span className="text-xs font-bold text-[#a33900] flex items-center gap-1 group-hover:gap-2 transition-all">
            <span>Buka Kelola Voucher</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>

        <div
          onClick={onNavigateToReport}
          className="cursor-pointer bg-white hover:bg-[#f9f9ff] rounded-3xl p-6 border border-[#dee8ff] hover:border-[#825100] transition-all shadow-sm space-y-3 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#6ffbbe]/30 text-[#006c49] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-2xl">monitoring</span>
          </div>
          <h3 className="text-base font-extrabold text-[#111c2d]">Laporan Penjualan</h3>
          <p className="text-xs text-[#5a4138] leading-relaxed">
            Lihat grafik rekapitulasi omzet, tren hidangan terlaris, dan rincian transaksi harian.
          </p>
          <span className="text-xs font-bold text-[#006c49] flex items-center gap-1 group-hover:gap-2 transition-all">
            <span>Lihat Laporan Omzet</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export { HalamanDashboardPenjual };
export default HalamanDashboardPenjual;
