import React from 'react';
import { MenuItem } from '../types';

interface DashboardPenjualProps {
  menuList: MenuItem[];
  isStoreOpen?: boolean;
  onToggleStoreStatus?: () => void;
  onNavigateToStock?: () => void;
  onNavigateToOrders?: () => void;
}

export const DashboardPenjual: React.FC<DashboardPenjualProps> = ({
  menuList,
  isStoreOpen = true,
  onToggleStoreStatus,
  onNavigateToStock,
  onNavigateToOrders
}) => {
  const jumlahTersedia = menuList.filter((x) => x.isAvailable).length;
  const jumlahTotal = menuList.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Merchant Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dee8ff]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center font-bold text-xl shadow-xs">
            <span className="material-symbols-outlined text-2xl">monitoring</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d]">
                Dashboard Merchant: Resto Bebek Juara
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isStoreOpen
                    ? 'bg-[#6ffbbe] text-[#002113]'
                    : 'bg-[#ffdad6] text-[#ba1a1a]'
                }`}
              >
                {isStoreOpen ? 'Toko Buka (Menerima Pesanan)' : 'Toko Tutup (Istirahat)'}
              </span>
            </div>
            <p className="text-xs text-[#5a4138] mt-0.5">
              Outlet Kebayoran Baru • Status Legalitas: <strong className="text-[#006c49]">Terverifikasi NIB/KTP/NPWP</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tombol Akses Buka dan Tutup Toko */}
          {onToggleStoreStatus && (
            <button
              type="button"
              onClick={onToggleStoreStatus}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs cursor-pointer ${
                isStoreOpen
                  ? 'bg-[#6ffbbe]/30 text-[#004d33] border-[#6cf8bb] hover:bg-[#6ffbbe]/50'
                  : 'bg-[#ffdad6] text-[#ba1a1a] border-[#ffb4ab] hover:bg-[#ffdad6]/80'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isStoreOpen ? 'bg-[#006c49] animate-pulse' : 'bg-[#ba1a1a]'}`}></span>
              <span>{isStoreOpen ? 'Toko Buka' : 'Toko Tutup'}</span>
              <span className="material-symbols-outlined text-lg">
                {isStoreOpen ? 'toggle_on' : 'toggle_off'}
              </span>
            </button>
          )}

          <div className="px-5 py-2.5 bg-white rounded-2xl border border-[#dee8ff] text-right shadow-xs">
            <span className="text-[10px] text-[#5a4138] uppercase font-bold block">Omzet Penjualan Hari Ini</span>
            <span className="text-xl font-extrabold text-[#a33900]">Rp 1.480.000</span>
          </div>
        </div>
      </div>

      {/* Banner Peringatan jika Toko Tutup */}
      {!isStoreOpen && (
        <div className="mt-4 p-4 rounded-2xl bg-[#ffdad6] border border-[#ffb4ab] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#ba1a1a]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-xl shrink-0">store_mall_directory</span>
            <span>
              <strong>Status Toko Saat Ini: TUTUP.</strong> Menu Anda tetap dapat dilihat pembeli di katalog untuk referensi harga & foto, namun tombol pemesanan dinonaktifkan sementara hingga Anda membuka toko kembali.
            </span>
          </div>
          {onToggleStoreStatus && (
            <button
              type="button"
              onClick={onToggleStoreStatus}
              className="px-3.5 py-1.5 bg-[#ba1a1a] text-white rounded-xl font-bold hover:bg-[#93000a] shrink-0 self-start sm:self-auto"
            >
              Buka Toko Sekarang
            </button>
          )}
        </div>
      )}

      {/* Metric Cards: Menampilkan Metrik hingga Menu Aktif Tersedia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Metrik 1 */}
        <div className="bg-white p-6 rounded-3xl border border-[#dee8ff] shadow-sm">
          <div className="flex justify-between items-center text-[#5a4138]">
            <span className="text-xs font-bold uppercase tracking-wider">Pesanan Masuk</span>
            <div className="w-9 h-9 rounded-xl bg-[#ffdad6] text-[#cc4900] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">receipt_long</span>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-[#111c2d] block mt-3">28 Pesanan</span>
          <span className="text-[11px] text-[#006c49] font-bold flex items-center gap-1 mt-1">
            <span>↑ 14%</span>
            <span className="text-[#5a4138] font-normal">dibanding hari kemarin</span>
          </span>
        </div>

        {/* Metrik 2 */}
        <div className="bg-white p-6 rounded-3xl border border-[#dee8ff] shadow-sm">
          <div className="flex justify-between items-center text-[#5a4138]">
            <span className="text-xs font-bold uppercase tracking-wider">Timer Respon Rata-rata</span>
            <div className="w-9 h-9 rounded-xl bg-[#ffddb8] text-[#825100] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">timer</span>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-[#111c2d] block mt-3">2 Menit 14 Detik</span>
          <span className="text-[11px] text-[#006c49] font-bold flex items-center gap-1 mt-1">
            <span>Aman</span>
            <span className="text-[#5a4138] font-normal">dari batas 10 menit</span>
          </span>
        </div>

        {/* Metrik 3 */}
        <div className="bg-white p-6 rounded-3xl border border-[#dee8ff] shadow-sm">
          <div className="flex justify-between items-center text-[#5a4138]">
            <span className="text-xs font-bold uppercase tracking-wider">Rating Kepuasan Rasa</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">star</span>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-[#111c2d] block mt-3">4.9 / 5.0</span>
          <span className="text-[11px] text-[#5a4138] block mt-1">
            Berdasarkan 1.250 ulasan konsumen
          </span>
        </div>

        {/* Metrik 4: Menu Aktif Tersedia */}
        <div className="bg-white p-6 rounded-3xl border border-[#dee8ff] shadow-sm">
          <div className="flex justify-between items-center text-[#5a4138]">
            <span className="text-xs font-bold uppercase tracking-wider">Menu Aktif Tersedia</span>
            <div className="w-9 h-9 rounded-xl bg-[#6ffbbe]/40 text-[#006c49] flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">inventory_2</span>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-[#111c2d] block mt-3">
            {jumlahTersedia} dari {jumlahTotal} Menu
          </span>
          <span className="text-[11px] text-[#006c49] font-bold block mt-1">
            {jumlahTotal - jumlahTersedia > 0 ? `${jumlahTotal - jumlahTersedia} menu ditandai habis` : 'Semua menu siap dipesan'}
          </span>
        </div>
      </div>

      {/* Ringkasan Analitik Performa & Navigasi Cepat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Card 1: Grafik & Performa Penjualan */}
        <div className="bg-white p-6 rounded-3xl border border-[#dee8ff] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#825100]">bar_chart</span>
                <h3 className="text-sm font-bold text-[#111c2d]">Performa Omzet 7 Hari Terakhir</h3>
              </div>
              <span className="text-xs text-[#006c49] font-bold">Rata-rata: Rp 1.35jt/hari</span>
            </div>

            <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2">
              {[
                { day: 'Sen', amount: 'Rp 1.1jt', h: '55%' },
                { day: 'Sel', amount: 'Rp 1.2jt', h: '60%' },
                { day: 'Rab', amount: 'Rp 1.4jt', h: '70%' },
                { day: 'Kam', amount: 'Rp 1.3jt', h: '65%' },
                { day: 'Jum', amount: 'Rp 1.6jt', h: '85%' },
                { day: 'Sab', amount: 'Rp 1.8jt', h: '95%' },
                { day: 'Min (Hari Ini)', amount: 'Rp 1.48jt', h: '78%', active: true }
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div
                    style={{ height: bar.h }}
                    className={`w-full rounded-xl transition-all group-hover:opacity-90 ${
                      bar.active ? 'bg-[#a33900] shadow-sm' : 'bg-[#dee8ff]'
                    }`}
                  ></div>
                  <span className={`text-[10px] text-center ${bar.active ? 'font-bold text-[#a33900]' : 'text-[#5a4138]'}`}>
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#5a4138] pt-3 border-t border-[#f0f3ff]">
            Jam paling ramai: <strong>11:30 - 13:30 WIB</strong> & <strong>18:00 - 20:00 WIB</strong> (Waktu makan siang & malam).
          </p>
        </div>

        {/* Card 2: Akses Cepat ke Menu Pesanan & Menu Kelola Stok */}
        <div className="bg-white p-6 rounded-3xl border border-[#dee8ff] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-[#f0f3ff]">
              <span className="material-symbols-outlined text-[#a33900]">tune</span>
              <h3 className="text-sm font-bold text-[#111c2d]">Akses Operasional Toko</h3>
            </div>

            <div className="space-y-4 my-4">
              <div className="p-4 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#111c2d]">Antrean Pesanan Masuk (Timer 10 Menit)</h4>
                  <p className="text-[11px] text-[#5a4138] mt-0.5">
                    Pantau pesanan baru yang harus dikonfirmasi dapur sebelum batas waktu 10 menit.
                  </p>
                </div>
                {onNavigateToOrders && (
                  <button
                    type="button"
                    onClick={onNavigateToOrders}
                    className="px-3.5 py-2 bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
                  >
                    Buka Pesanan
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#ffddb8]/30 border border-[#ffddb8] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#111c2d]">Menu Kelola Stok Warung</h4>
                  <p className="text-[11px] text-[#5a4138] mt-0.5">
                    Tandai menu habis saat bahan habis atau aktifkan kembali ketika selesai dimasak.
                  </p>
                </div>
                {onNavigateToStock && (
                  <button
                    type="button"
                    onClick={onNavigateToStock}
                    className="px-3.5 py-2 bg-[#825100] hover:bg-[#a36700] text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
                  >
                    Buka Kelola Stok
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-[#5a4138] bg-[#f9f9ff] p-3 rounded-2xl border border-[#dee8ff]">
            Tips Merchant: Rutin memperbarui stok menu di menu <strong>Kelola Stok</strong> mencegah pembatalan pesanan dan menjaga rating toko.
          </div>
        </div>
      </div>
    </div>
  );
};

export const MerchantDashboardView = DashboardPenjual;
export const TampilanDashboardPenjual = DashboardPenjual;
export default DashboardPenjual;
