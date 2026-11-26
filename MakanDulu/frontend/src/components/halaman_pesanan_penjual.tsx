import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types';
import {
  getPesananPenjual,
  konfirmasiPesananPenjual,
  tandaiPesananDiantar,
  simulasiWaktuHabis,
  PenjualOrderItem,
} from '../services/apiClient';

interface PesananPenjualProps {
  showToast: (title: string, message: string, isError?: boolean) => void;
  onNavigateToDashboard?: () => void;
  userProfile?: UserProfile | null;
}

const mapStatusUi = (
  statusDb: string
): 'menunggu' | 'dimasak' | 'siap_diantar' | 'selesai' | 'auto_batal_10mnt' => {
  const s = String(statusDb || '').toLowerCase();
  if (s.includes('batal')) return 'auto_batal_10mnt';
  if (s.includes('selesai')) return 'selesai';
  if (s.includes('antar')) return 'siap_diantar';
  if (s.includes('sedang disiapkan') || s.includes('diterima') || s.includes('disiapkan')) {
    return 'dimasak';
  }
  return 'menunggu';
};

const PesananPenjual: React.FC<PesananPenjualProps> = ({
  showToast,
  onNavigateToDashboard,
  userProfile,
}) => {
  const [activeFilter, setActiveFilter] = useState<'semua' | 'menunggu' | 'dimasak' | 'siap' | 'batal'>('semua');
  const [orders, setOrders] = useState<PenjualOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const muatPesanan = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await getPesananPenjual(userProfile?.id);
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      }
    } catch (err) {
      if (isInitial) {
        console.warn('[HalamanPesananPenjual] Gagal memuat pesanan:', err);
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [userProfile?.id]);

  // Sinkronisasi berkala tiap 4 detik agar pesanan Non-COD yang baru selesai dibayar langsung masuk
  useEffect(() => {
    muatPesanan(true);
    const poll = setInterval(() => muatPesanan(false), 4000);
    return () => clearInterval(poll);
  }, [muatPesanan]);

  // Countdown hitung mundur 10 menit tersinkronisasi dengan batasKonfirmasiAt database
  useEffect(() => {
    const timer = setInterval(() => {
      let adaYangHabis = false;
      setOrders((prev) =>
        prev.map((order) => {
          if (mapStatusUi(order.statusPesanan) === 'menunggu') {
            const nextSecs = order.batasKonfirmasiAt
              ? Math.max(0, Math.floor((new Date(order.batasKonfirmasiAt).getTime() - Date.now()) / 1000))
              : Math.max(0, order.remainingSeconds - 1);

            if (nextSecs <= 0 && order.remainingSeconds > 0) {
              adaYangHabis = true;
            }
            return { ...order, remainingSeconds: nextSecs };
          }
          return order;
        })
      );
      if (adaYangHabis) {
        muatPesanan(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [muatPesanan]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  /**
   * Main Flow Sequence Diagram:
   * Penjual -> halaman_dashboard_penjual: Memeriksa rincian pesanan dan menekan tombol "Terima Pesanan"
   * -> pesanan_controller: konfirmasi_pesanan(idPesanan)
   * -> Pesanan: Mengubah status pesanan menjadi "Sedang Disiapkan"
   * -> timer_controller: stop_timer(idPesanan)
   * -> layanan_notifikasi: Kirim notifikasi pembaruan status pesanan
   */
  const handleConfirmOrder = async (ord: PenjualOrderItem) => {
    setProcessingId(ord.idPesanan);
    try {
      const res = await konfirmasiPesananPenjual(ord.idPesanan);
      showToast(
        'Pesanan Diterima!',
        res.message || `Pesanan #${ord.orderNumber} kini berstatus "Sedang Disiapkan" & timer dihentikan.`
      );
      await muatPesanan(false);
    } catch (err) {
      showToast(
        'Gagal Konfirmasi Pesanan',
        err instanceof Error ? err.message : 'Terjadi kesalahan saat mengonfirmasi pesanan.',
        true
      );
      await muatPesanan(false);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReadyForCourier = async (ord: PenjualOrderItem) => {
    setProcessingId(ord.idPesanan);
    try {
      const res = await tandaiPesananDiantar(ord.idPesanan);
      showToast(
        'Makanan Siap Diantar!',
        res.message || 'Notifikasi dikirim ke pembeli & kurir untuk serah terima.'
      );
      await muatPesanan(false);
    } catch (err) {
      showToast(
        'Gagal Memperbarui Status',
        err instanceof Error ? err.message : 'Terjadi kesalahan.',
        true
      );
    } finally {
      setProcessingId(null);
    }
  };

  /**
   * Alternative Flow #1 Auto Cancel:
   * Simulasi timer_controller mengirim sinyal "Waktu habis" -> pesanan_controller -> "Dibatalkan Otomatis"
   */
  const simulateAutoCancelTimer = async (ord: PenjualOrderItem) => {
    setProcessingId(ord.idPesanan);
    try {
      await simulasiWaktuHabis(ord.idPesanan);
      showToast(
        'Dibatalkan Otomatis (Waktu Habis)',
        `Pesanan #${ord.orderNumber} dibatalkan otomatis & notifikasi dikirim ke pembeli serta penjual.`,
        true
      );
      await muatPesanan(false);
    } catch (err) {
      showToast(
        'Simulasi Gagal',
        err instanceof Error ? err.message : 'Gagal menjalankan simulasi waktu habis.',
        true
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const uiStatus = mapStatusUi(ord.statusPesanan);
    if (activeFilter === 'menunggu') return uiStatus === 'menunggu';
    if (activeFilter === 'dimasak') return uiStatus === 'dimasak';
    if (activeFilter === 'siap') return uiStatus === 'siap_diantar' || uiStatus === 'selesai';
    if (activeFilter === 'batal') return uiStatus === 'auto_batal_10mnt';
    return true;
  });

  const countMenunggu = orders.filter((o) => mapStatusUi(o.statusPesanan) === 'menunggu').length;
  const countDimasak = orders.filter((o) => mapStatusUi(o.statusPesanan) === 'dimasak').length;
  const countSiap = orders.filter((o) => ['siap_diantar', 'selesai'].includes(mapStatusUi(o.statusPesanan))).length;
  const countBatal = orders.filter((o) => mapStatusUi(o.statusPesanan) === 'auto_batal_10mnt').length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#dee8ff] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
            Pesanan Masuk {userProfile?.storeName || 'Resto'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4138] mt-1">
            Pesanan Non-COD hanya masuk setelah pembayaran berhasil diverifikasi. Segera periksa rincian dan klik <strong>"Terima Pesanan"</strong> sebelum timer 10 menit berakhir.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => muatPesanan(false)}
            className="px-3.5 py-2.5 bg-white hover:bg-[#f0f3ff] text-[#111c2d] border border-[#dee8ff] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            <span>Muat Ulang</span>
          </button>
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-4 py-2.5 bg-[#825100] hover:bg-[#a36700] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">monitoring</span>
              <span>Dashboard Merchant</span>
            </button>
          )}
        </div>
      </div>

      {/* Rules Notice Banner */}
      <div className="my-5 p-4 rounded-2xl bg-[#ffddb8]/40 border border-[#ffb95f] flex items-start gap-3">
        <span className="material-symbols-outlined text-[#825100] text-xl mt-0.5 shrink-0">
          info
        </span>
        <div className="text-xs text-[#5a4138] leading-relaxed">
          <strong className="text-[#111c2d]">Catatan:</strong> Penjual tidak memiliki tombol tolak manual. Saat pesanan masuk, klik <strong>"Terima Pesanan"</strong> untuk mengubah status menjadi <strong>"Sedang Disiapkan"</strong> dan menghentikan timer otomatis. Jika waktu 10 menit habis tanpa konfirmasi, sistem membatalkan pesanan menjadi <strong>"Dibatalkan Otomatis"</strong> dan mengirim notifikasi ke pembeli serta penjual.
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto my-4 pb-1">
        {[
          { id: 'semua', label: `Semua Pesanan (${orders.length})` },
          { id: 'menunggu', label: `Perlu Konfirmasi (${countMenunggu})` },
          { id: 'dimasak', label: `Sedang Disiapkan (${countDimasak})` },
          { id: 'siap', label: `Diantar / Selesai (${countSiap})` },
          { id: 'batal', label: `Dibatalkan Otomatis (${countBatal})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
              activeFilter === tab.id
                ? 'bg-[#825100] text-white border-[#825100] shadow-xs'
                : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#dee8ff] space-y-3">
          <span className="material-symbols-outlined text-4xl text-[#825100] animate-spin">progress_activity</span>
          <p className="text-xs font-bold text-[#5a4138]">Memuat antrean pesanan masuk dari database...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#dee8ff] space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#f0f3ff] text-[#5a4138] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <h3 className="text-base font-extrabold text-[#111c2d]">Belum Ada Pesanan pada Kategori Ini</h3>
          <p className="text-xs text-[#5a4138] max-w-md mx-auto">
            Pesanan COD maupun Non-COD yang sudah selesai dibayar oleh pembeli akan otomatis tampil di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((ord) => {
            const uiStatus = mapStatusUi(ord.statusPesanan);
            return (
              <div
                key={ord.id}
                className={`rounded-3xl p-6 border transition-all shadow-sm flex flex-col justify-between ${
                  uiStatus === 'auto_batal_10mnt'
                    ? 'bg-[#f0f3ff] border-[#dee8ff] opacity-80'
                    : 'bg-white border-[#dee8ff] hover:shadow-md'
                }`}
              >
                <div>
                  {/* Order Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff] gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-[#111c2d] bg-[#f0f3ff] px-2 py-0.5 rounded-lg border border-[#dee8ff]">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-[11px] text-[#5a4138]">{ord.orderTime}</span>
                    </div>

                    {/* Status Badges */}
                    {uiStatus === 'menunggu' && (
                      <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold animate-pulse">
                        <span className="material-symbols-outlined text-xs">alarm</span>
                        <span>Sisa: {formatTimer(ord.remainingSeconds)}</span>
                      </div>
                    )}
                    {uiStatus === 'dimasak' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#825100] text-[11px] font-bold">
                        Sedang Disiapkan
                      </span>
                    )}
                    {uiStatus === 'siap_diantar' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] text-[11px] font-bold">
                        Pesanan Diantar
                      </span>
                    )}
                    {uiStatus === 'selesai' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#6ffbbe]/60 text-[#004d33] text-[11px] font-bold">
                        Pesanan Selesai
                      </span>
                    )}
                    {uiStatus === 'auto_batal_10mnt' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold">
                        Dibatalkan Otomatis
                      </span>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="py-3">
                    <span className="text-xs font-bold text-[#111c2d] block">{ord.customerName}</span>
                    <span className="text-[11px] text-[#5a4138] line-clamp-2 mt-0.5">{ord.customerAddress}</span>
                    {ord.catatan && (
                      <span className="block text-[11px] text-[#825100] font-semibold mt-1">
                        Catatan: "{ord.catatan}"
                      </span>
                    )}
                  </div>

                  {/* Ordered Menu Items */}
                  <div className="bg-[#f0f3ff] p-3 rounded-2xl border border-[#dee8ff] space-y-2">
                    {ord.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-bold text-[#111c2d]">{it.qty}x {it.name}</span>
                          {it.modifier && (
                            <span className="block text-[11px] text-[#a33900]">{it.modifier}</span>
                          )}
                        </div>
                        <span className="font-semibold text-[#111c2d]">
                          Rp {(it.price * it.qty).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Payment */}
                  <div className="pt-3 flex justify-between items-center text-xs gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        ord.isCOD
                          ? 'bg-[#ffddb8] text-[#825100]'
                          : 'bg-[#6ffbbe]/40 text-[#004d33]'
                      }`}
                    >
                      {ord.paymentType}
                    </span>
                    <span className="text-sm font-extrabold text-[#a33900] shrink-0">
                      Rp {ord.totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 mt-3 border-t border-[#f0f3ff]">
                  {uiStatus === 'menunggu' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={processingId === ord.idPesanan}
                        onClick={() => handleConfirmOrder(ord)}
                        className="w-full py-3 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>
                          {processingId === ord.idPesanan ? 'Mengonfirmasi...' : 'Terima Pesanan'}
                        </span>
                      </button>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-[#5a4138]">
                          Auto-batal jika 10 mnt habis
                        </span>
                        <button
                          type="button"
                          disabled={processingId === ord.idPesanan}
                          onClick={() => simulateAutoCancelTimer(ord)}
                          className="text-[10px] text-[#ba1a1a] font-bold hover:underline disabled:opacity-50"
                        >
                          Uji Simulasi Auto-Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {uiStatus === 'dimasak' && (
                    <button
                      type="button"
                      disabled={processingId === ord.idPesanan}
                      onClick={() => handleReadyForCourier(ord)}
                      className="w-full py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-sm">moped</span>
                      <span>Makanan Selesai Dimasak (Panggil Kurir)</span>
                    </button>
                  )}

                  {uiStatus === 'siap_diantar' && (
                    <div className="w-full py-2.5 rounded-xl bg-[#6ffbbe]/30 text-[#006c49] text-xs font-bold text-center border border-[#6cf8bb]">
                      Kurir sedang mengantar pesanan ke pembeli
                    </div>
                  )}

                  {uiStatus === 'selesai' && (
                    <div className="w-full py-2.5 rounded-xl bg-[#6ffbbe]/20 text-[#004d33] text-xs font-bold text-center border border-[#6cf8bb]">
                      Pesanan telah diterima pembeli & selesai
                    </div>
                  )}

                  {uiStatus === 'auto_batal_10mnt' && (
                    <div className="w-full p-2.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs text-center border border-[#ffb4ab]">
                      <p className="font-bold">Dibatalkan Otomatis oleh Sistem</p>
                      <p className="text-[10px] mt-0.5">Batas 10 menit berakhir tanpa konfirmasi penjual.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export { PesananPenjual };
export const HalamanPesananPenjual = PesananPenjual;
export default PesananPenjual;
