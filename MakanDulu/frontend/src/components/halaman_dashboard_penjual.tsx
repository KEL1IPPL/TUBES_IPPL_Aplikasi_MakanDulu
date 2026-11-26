import React, { useState, useEffect, useCallback } from 'react';
import { MenuItem, UserProfile } from '../types';
import {
  getPesananPenjual,
  konfirmasiPesananPenjual,
  simulasiWaktuHabis,
  PenjualOrderItem,
} from '../services/apiClient';

interface HalamanDashboardPenjualProps {
  menuList: MenuItem[];
  isStoreOpen: boolean;
  onToggleStoreStatus: () => void;
  onNavigateToMenu: () => void;
  onNavigateToOrders: () => void;
  onNavigateToVoucher: () => void;
  onNavigateToReport: () => void;
  userProfile?: UserProfile | null;
  showToast?: (title: string, message: string, isError?: boolean) => void;
}

const HalamanDashboardPenjual: React.FC<HalamanDashboardPenjualProps> = ({
  menuList,
  isStoreOpen,
  onToggleStoreStatus,
  onNavigateToMenu,
  onNavigateToOrders,
  onNavigateToVoucher,
  onNavigateToReport,
  userProfile,
  showToast,
}) => {
  const [orders, setOrders] = useState<PenjualOrderItem[]>([]);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const muatPesananPenjual = useCallback(async () => {
    try {
      const res = await getPesananPenjual(userProfile?.id);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      console.warn('[HalamanDashboardPenjual] Gagal memuat pesanan penjual:', err);
    }
  }, [userProfile?.id]);

  // Poll backend tiap 4 detik agar pesanan Non-COD yang baru dibayar langsung muncul di dashboard
  useEffect(() => {
    muatPesananPenjual();
    const poll = setInterval(muatPesananPenjual, 4000);
    return () => clearInterval(poll);
  }, [muatPesananPenjual]);

  // Countdown tick tiap 1 detik mengikuti batasKonfirmasiAt dari server
  useEffect(() => {
    const ticker = setInterval(() => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.statusPesanan !== 'Menunggu Konfirmasi Penjual') return ord;
          if (ord.batasKonfirmasiAt) {
            const sisa = Math.max(
              0,
              Math.floor((new Date(ord.batasKonfirmasiAt).getTime() - Date.now()) / 1000)
            );
            return { ...ord, remainingSeconds: sisa };
          }
          return { ...ord, remainingSeconds: Math.max(0, ord.remainingSeconds - 1) };
        })
      );
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /**
   * Main Flow Sequence Diagram:
   * Penjual -> halaman_dashboard_penjual: Memeriksa rincian pesanan dan menekan tombol "Terima Pesanan"
   * halaman_dashboard_penjual -> pesanan_controller: konfirmasi_pesanan(idPesanan)
   */
  const handleTerimaPesanan = async (ord: PenjualOrderItem) => {
    setConfirmingId(ord.idPesanan);
    try {
      const res = await konfirmasiPesananPenjual(ord.idPesanan);
      if (showToast) {
        showToast(
          'Pesanan Diterima!',
          res.message || `Pesanan #${ord.orderNumber} kini berstatus "Sedang Disiapkan".`
        );
      }
      await muatPesananPenjual();
    } catch (err) {
      if (showToast) {
        showToast(
          'Gagal Konfirmasi',
          err instanceof Error ? err.message : 'Gagal mengonfirmasi pesanan.',
          true
        );
      }
      await muatPesananPenjual();
    } finally {
      setConfirmingId(null);
    }
  };

  const handleSimulasiAutoBatal = async (ord: PenjualOrderItem) => {
    setConfirmingId(ord.idPesanan);
    try {
      await simulasiWaktuHabis(ord.idPesanan);
      if (showToast) {
        showToast(
          'Pesanan Dibatalkan Otomatis',
          `Waktu konfirmasi 10 menit untuk #${ord.orderNumber} habis. Notifikasi dikirim ke pembeli & penjual.`,
          true
        );
      }
      await muatPesananPenjual();
    } catch (err) {
      if (showToast) {
        showToast(
          'Simulasi Gagal',
          err instanceof Error ? err.message : 'Gagal menjalankan simulasi waktu habis.',
          true
        );
      }
    } finally {
      setConfirmingId(null);
    }
  };

  const pesananMenunggu = orders.filter((o) => o.statusPesanan === 'Menunggu Konfirmasi Penjual');
  const pesananDimasak = orders.filter((o) =>
    ['Sedang Disiapkan', 'Pesanan Diterima oleh Penjual', 'Pesanan Disiapkan'].includes(o.statusPesanan)
  );
  const pesananDiantar = orders.filter((o) => o.statusPesanan === 'Pesanan Diantar');
  const totalOmzet = orders
    .filter((o) => !String(o.statusPesanan).toLowerCase().includes('batal'))
    .reduce((acc, o) => acc + Number(o.totalPrice || 0), 0);

  const totalMenu = menuList.length;
  const availableMenu = menuList.filter((m) => m.isAvailable).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-6">
      {/* Top Banner & Store Toggle */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full ${isStoreOpen ? 'bg-[#006c49] animate-pulse' : 'bg-[#ba1a1a]'}`} />
            <span className="text-xs font-black uppercase tracking-wider text-[#5a4138]">
              Status Operasional Merchant (halaman_dashboard_penjual)
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#111c2d]">
            {userProfile?.storeName || 'Resto Mitra'} • {isStoreOpen ? 'Toko Buka' : 'Toko Tutup'}
          </h1>
          <p className="text-xs text-[#5a4138]">
            {isStoreOpen
              ? `${userProfile?.storeName || 'Resto'} siap menerima pesanan COD maupun Non-COD yang telah selesai dibayar pembeli.`
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

      {/* Incoming Order Urgent Alerts with 10-Minute Timer & "Terima Pesanan" Button */}
      {pesananMenunggu.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[#111c2d] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a33900] animate-ping" />
              <span>Pesanan Baru Masuk Perlu Konfirmasi ({pesananMenunggu.length})</span>
            </h2>
            <button
              type="button"
              onClick={onNavigateToOrders}
              className="text-xs font-bold text-[#a33900] hover:underline"
            >
              Kelola Semua Antrean Pesanan →
            </button>
          </div>

          {pesananMenunggu.map((ord) => (
            <div
              key={ord.id}
              className="bg-gradient-to-r from-[#fff7f4] via-[#ffede6] to-[#fffbff] border-2 border-[#ffdbce] rounded-3xl p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#a33900] text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-2xl animate-pulse">alarm</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#a33900] text-white text-[10px] font-black uppercase tracking-wider">
                        Pesanan Masuk Baru!
                      </span>
                      <span className="text-xs font-mono font-bold text-[#111c2d]">#{ord.orderNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          ord.isCOD
                            ? 'bg-[#ffddb8] text-[#825100]'
                            : 'bg-[#6ffbbe]/50 text-[#004d33]'
                        }`}
                      >
                        {ord.paymentType}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#111c2d]">
                      {ord.customerName} • {ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </h3>
                    <p className="text-xs text-[#5a4138] mt-0.5">
                      Alamat: {ord.customerAddress} • Total:{' '}
                      <strong className="text-[#a33900]">Rp {ord.totalPrice.toLocaleString('id-ID')}</strong>
                    </p>
                    {ord.catatan && (
                      <p className="text-[11px] text-[#825100] font-semibold mt-1">
                        Catatan: "{ord.catatan}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  <div className="text-left sm:text-right px-3 py-2 rounded-2xl bg-white/80 border border-[#ffdbce]">
                    <span className="text-[10px] text-[#5a4138] font-bold block">Sisa Waktu Konfirmasi:</span>
                    <span className="text-xl font-black font-mono text-[#ba1a1a]">
                      {formatTimer(ord.remainingSeconds)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      disabled={confirmingId === ord.idPesanan}
                      onClick={() => handleTerimaPesanan(ord)}
                      className="px-5 py-3 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>{confirmingId === ord.idPesanan ? 'Memproses...' : 'Terima Pesanan'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={confirmingId === ord.idPesanan}
                      onClick={() => handleSimulasiAutoBatal(ord)}
                      className="text-[10px] text-[#ba1a1a] font-bold hover:underline text-center"
                    >
                      Simulasi Waktu Habis (Auto-Batal)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#dee8ff] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#6ffbbe]/30 text-[#006c49] flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">inbox</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#111c2d]">
                Belum Ada Pesanan Baru yang Menunggu Konfirmasi
              </h2>
              <p className="text-xs text-[#5a4138]">
                Pesanan Non-COD akan otomatis masuk ke sini setelah pembeli menyelesaikan pembayaran di Midtrans.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToOrders}
            className="px-4 py-2.5 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold transition-all shrink-0"
          >
            Lihat Semua Pesanan ({orders.length})
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-[#dee8ff] shadow-2xs space-y-2">
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Total Omzet Pesanan
          </span>
          <span className="text-2xl font-black text-[#111c2d]">
            Rp {totalOmzet.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-[#006c49] font-bold block">
            Tersinkronisasi langsung dari database
          </span>
        </div>

        <div
          onClick={onNavigateToOrders}
          className="cursor-pointer bg-white rounded-3xl p-5 border border-[#dee8ff] hover:border-[#825100] shadow-2xs space-y-2 transition-all"
        >
          <span className="text-[11px] font-bold text-[#5a4138] uppercase tracking-wider block">
            Antrean Pesanan Aktif
          </span>
          <span className="text-2xl font-black text-[#825100]">
            {pesananMenunggu.length + pesananDimasak.length + pesananDiantar.length} Pesanan
          </span>
          <span className="text-[11px] text-[#5a4138] block">
            {pesananMenunggu.length} Baru, {pesananDimasak.length} Disiapkan, {pesananDiantar.length} Diantar
          </span>
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
            <span className="text-xs text-[#5a4138]">(Mitra Resmi)</span>
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
