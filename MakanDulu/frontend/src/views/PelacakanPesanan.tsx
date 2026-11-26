import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OrderRecord } from '../types';
import { COURIER_AVATAR_URL, POD_PHOTO_URL } from '../data/dataMock';
import {
  getStatusPesanan,
  cekStatusPembayaran,
  konfirmasiPembayaranSelesai,
  selesaikanPesananPembeli,
  kirimUlasan,
} from '../services/apiClient';

type TrackingUiStatus =
  | 'menunggu_pembayaran'
  | 'menunggu_konfirmasi'
  | 'dimasak'
  | 'diantar'
  | 'selesai'
  | 'ditolak_cod'
  | 'auto_batal_10mnt';

const mapDbStatusToUi = (statusDb?: string, fallback?: OrderRecord['status']): TrackingUiStatus => {
  const s = String(statusDb || '').toLowerCase();
  if (s.includes('batal')) return 'auto_batal_10mnt';
  if (s.includes('selesai')) return 'selesai';
  if (s.includes('antar')) return 'diantar';
  if (s.includes('sedang disiapkan') || s.includes('diterima') || s.includes('disiapkan')) return 'dimasak';
  if (s.includes('menunggu konfirmasi')) return 'menunggu_konfirmasi';
  if (s.includes('menunggu pembayaran')) return 'menunggu_pembayaran';
  if (fallback === 'dibatalkan') return 'auto_batal_10mnt';
  return (fallback as TrackingUiStatus) || 'menunggu_konfirmasi';
};

interface PelacakanPesananProps {
  currentOrder: OrderRecord | null;
  onUpdateOrder?: (updated: OrderRecord) => void;
  onNavigateToCatalog: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
  isMerchantView?: boolean;
  onOrderCompleted?: (orderId: string) => void;
}

export const PelacakanPesanan: React.FC<PelacakanPesananProps> = ({
  currentOrder,
  onUpdateOrder,
  onNavigateToCatalog,
  showToast,
  isMerchantView = false,
  onOrderCompleted,
}) => {
  const [orderStatus, setOrderStatus] = useState<TrackingUiStatus>(() =>
    mapDbStatusToUi(currentOrder?.statusPesananDb, currentOrder?.status)
  );
  const [statusPembayaranLive, setStatusPembayaranLive] = useState<string>(
    currentOrder?.statusPembayaran || ''
  );
  const [batasKonfirmasiAt, setBatasKonfirmasiAt] = useState<string | null>(
    currentOrder?.batasKonfirmasiAt || null
  );
  const [remainingSecs, setRemainingSecs] = useState<number>(
    currentOrder?.merchantTimerSeconds ?? 600
  );
  const [checkingPayment, setCheckingPayment] = useState(false);

  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<'rusak' | 'tidak_sesuai' | 'basi'>('rusak');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectionSummary, setRejectionSummary] = useState<string | null>(null);

  // Review states
  const [ratingStars, setRatingStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Rasa Mantap', 'Masih Hangat', 'Pengemasan Rapi']);
  const [reviewNote, setReviewNote] = useState('Rasanya enak, pengemasan rapi, dan pengantaran cepat!');
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  const prevStatusRef = useRef<TrackingUiStatus>(orderStatus);

  // Sinkronisasi awal saat currentOrder prop berubah
  useEffect(() => {
    if (!currentOrder) return;
    const mapped = mapDbStatusToUi(currentOrder.statusPesananDb, currentOrder.status);
    setOrderStatus(mapped);
    prevStatusRef.current = mapped;
    setStatusPembayaranLive(currentOrder.statusPembayaran || '');
    setBatasKonfirmasiAt(currentOrder.batasKonfirmasiAt || null);
    setRemainingSecs(currentOrder.merchantTimerSeconds ?? 600);
  }, [currentOrder?.id, currentOrder?.idPesanan, currentOrder?.status, currentOrder?.statusPesananDb]);

  // Poll status real-time dari backend (pesanan_controller / pemesanan_controller)
  const sinkronkanStatusDariServer = useCallback(async () => {
    const idPesanan = currentOrder?.idPesanan;
    if (!idPesanan) return;

    try {
      const res = await getStatusPesanan(idPesanan);
      const d = res?.data;
      if (!d) return;

      const nextStatus = mapDbStatusToUi(d.statusPesanan);
      const prevStatus = prevStatusRef.current;

      if (d.statusPembayaran) {
        setStatusPembayaranLive(d.statusPembayaran);
      }
      if (d.batasKonfirmasiAt !== undefined) {
        setBatasKonfirmasiAt(d.batasKonfirmasiAt);
      }
      if (typeof d.remainingSeconds === 'number') {
        setRemainingSecs(d.remainingSeconds);
      }

      if (nextStatus !== prevStatus) {
        prevStatusRef.current = nextStatus;
        setOrderStatus(nextStatus);

        if (nextStatus === 'menunggu_konfirmasi' && prevStatus === 'menunggu_pembayaran') {
          showToast(
            'Pembayaran Berhasil!',
            'Pembayaran terverifikasi. Pesanan Anda kini masuk ke penjual dan menunggu konfirmasi.'
          );
        } else if (nextStatus === 'dimasak') {
          showToast(
            'Pesanan Diterima Penjual!',
            `Resto telah mengonfirmasi pesanan #${d.orderNumber || currentOrder.orderNumber}. Status saat ini: Sedang Disiapkan.`
          );
        } else if (nextStatus === 'diantar') {
          showToast(
            'Pesanan Sedang Diantar!',
            'Makanan selesai dimasak dan kurir sedang menuju alamat pengantaran Anda.'
          );
        } else if (nextStatus === 'auto_batal_10mnt') {
          showToast(
            'Pesanan Dibatalkan Otomatis',
            'Batas waktu konfirmasi penjual 10 menit telah habis. Pesanan dibatalkan secara otomatis oleh sistem.',
            true
          );
        }

        if (onUpdateOrder && currentOrder) {
          onUpdateOrder({
            ...currentOrder,
            status: nextStatus === 'auto_batal_10mnt' ? 'auto_batal_10mnt' : (nextStatus as any),
            statusPesananDb: d.statusPesanan,
            statusPembayaran: d.statusPembayaran,
            batasKonfirmasiAt: d.batasKonfirmasiAt,
            merchantTimerSeconds: d.remainingSeconds ?? currentOrder.merchantTimerSeconds,
          });
        }
      }
    } catch {
      // Abaikan gangguan polling sementara
    }
  }, [currentOrder, onUpdateOrder, showToast]);

  useEffect(() => {
    if (!currentOrder?.idPesanan) return;
    if (['selesai', 'ditolak_cod', 'auto_batal_10mnt'].includes(orderStatus)) return;

    sinkronkanStatusDariServer();
    const timer = setInterval(sinkronkanStatusDariServer, 3000);
    return () => clearInterval(timer);
  }, [currentOrder?.idPesanan, orderStatus, sinkronkanStatusDariServer]);

  // Countdown tick tiap detik saat menunggu konfirmasi penjual
  useEffect(() => {
    if (orderStatus !== 'menunggu_konfirmasi') return;
    const ticker = setInterval(() => {
      if (batasKonfirmasiAt) {
        const diff = Math.max(
          0,
          Math.floor((new Date(batasKonfirmasiAt).getTime() - Date.now()) / 1000)
        );
        setRemainingSecs(diff);
        if (diff <= 0) {
          sinkronkanStatusDariServer();
        }
      } else {
        setRemainingSecs((s) => Math.max(0, s - 1));
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [orderStatus, batasKonfirmasiAt, sinkronkanStatusDariServer]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleLanjutkanPembayaranSnap = () => {
    if (!currentOrder?.idPesanan || !currentOrder.snapToken || !window.snap) {
      handlePeriksaStatusPembayaran();
      return;
    }

    const idPesanan = currentOrder.idPesanan;
    window.snap.pay(currentOrder.snapToken, {
      onSuccess: async (result: unknown) => {
        try {
          await konfirmasiPembayaranSelesai(idPesanan, result);
          await sinkronkanStatusDariServer();
        } catch (err) {
          console.error('Gagal konfirmasi pembayaran:', err);
        }
      },
      onPending: () => {
        showToast('Menunggu Pembayaran', 'Selesaikan pembayaran sesuai instruksi Midtrans.');
      },
      onError: () => {
        showToast('Pembayaran Gagal', 'Transaksi Midtrans gagal atau dibatalkan.', true);
      },
      onClose: () => {
        sinkronkanStatusDariServer();
      },
    });
  };

  const handlePeriksaStatusPembayaran = async () => {
    if (!currentOrder?.idPesanan) return;
    setCheckingPayment(true);
    try {
      const res = await cekStatusPembayaran(currentOrder.idPesanan);
      if (res?.data?.statusPembayaran === 'Pembayaran Berhasil') {
        await sinkronkanStatusDariServer();
      } else {
        showToast(
          'Status Pembayaran',
          `Status saat ini: ${res?.data?.statusPembayaran || 'Menunggu Pembayaran'}. Selesaikan pembayaran di Midtrans terlebih dahulu.`
        );
      }
    } catch {
      showToast('Gagal Memeriksa', 'Tidak dapat terhubung ke server pembayaran.', true);
    } finally {
      setCheckingPayment(false);
    }
  };

  const paymentMethod = currentOrder?.paymentMethod || 'cod';

  // Jika tidak ada pesanan aktif (atau pesanan sudah selesai & diulas):
  if (!currentOrder && !isMerchantView) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 py-16">
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#dee8ff] shadow-sm flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-3xl bg-[#6ffbbe]/20 text-[#006c49] flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl">task_alt</span>
          </div>
          <span className="px-3.5 py-1 rounded-full bg-[#6ffbbe]/30 text-[#004d33] text-xs font-black uppercase tracking-wider">
            Pengiriman • Selesai
          </span>
          <h2 className="text-2xl font-extrabold text-[#111c2d]">Tidak Ada Pesanan yang Sedang Diantar</h2>
          <p className="text-xs sm:text-sm text-[#5a4138] max-w-lg leading-relaxed">
            Semua pesanan Anda telah selesai dan diterima dengan baik. Saat ini tidak ada pesanan aktif yang sedang dalam proses pengantaran kurir.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="px-6 py-3 rounded-2xl bg-[#cc4900] text-white text-xs font-bold shadow-md hover:bg-[#a33900] transition-all flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-base">restaurant_menu</span>
              <span>Pilih Hidangan dari Katalog</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active order
  const order: OrderRecord = currentOrder || {
    id: 'ord-demo-1',
    orderNumber: 'MKD-998214',
    items: [
      {
        id: 'c-1',
        menuId: 'menu-1',
        name: 'Nasi Bebek Sinjay Madura Krispi',
        price: 38000,
        qty: 2,
        sublabel: 'Pedas Sedang • Sambal Terpisah',
        restaurant: 'Resto Bebek Juara'
      },
      {
        id: 'c-2',
        menuId: 'menu-4',
        name: 'Es Jeruk Nipis Madu Selasih',
        price: 12000,
        qty: 1,
        sublabel: 'Kurang Manis • Es Sedang',
        restaurant: 'Minuman Segar Dingin'
      }
    ],
    subtotal: 88000,
    shippingFee: 10000,
    serviceFee: 2000,
    discount: 0,
    total: 100000,
    paymentMethod,
    address: {
      label: 'Rumah',
      street: 'Jl. Sudirman No. 42 (Gedung B Lt. 3)',
      details: 'Kebayoran Baru, Jakarta Selatan',
      notes: 'Titip di meja resepsionis'
    },
    status: 'diantar',
    orderTime: '12:45 WIB',
    estimatedDeliveryTime: '12-15 Menit',
    driverName: 'Ahmad Fauzi',
    driverPhone: '0812-9981-2231',
    driverPlate: 'B 4821 KOP (Honda Vario 160)',
    driverRating: 4.9,
    podImageUrl: POD_PHOTO_URL,
    merchantTimerSeconds: 480
  };

  const isCOD = paymentMethod === 'cod';
  const restaurantName = order.items?.[0]?.restaurant || 'Mitra MakanDulu';

  const steps = [
    {
      id: 'pembayaran',
      label: isCOD
        ? 'Pesanan COD Diteruskan ke Penjual'
        : orderStatus === 'menunggu_pembayaran'
        ? 'Menunggu Pembayaran Non-COD'
        : 'Pembayaran Non-COD Berhasil (Lunas)',
      time: order.orderTime || 'Baru saja',
      done: orderStatus !== 'menunggu_pembayaran',
    },
    {
      id: 'masak',
      label:
        orderStatus === 'menunggu_konfirmasi'
          ? 'Menunggu Penjual Klik "Terima Pesanan"'
          : orderStatus === 'auto_batal_10mnt'
          ? 'Tidak Dikonfirmasi Penjual (10 Menit Habis)'
          : 'Diterima Penjual & Sedang Disiapkan',
      time: orderStatus === 'menunggu_konfirmasi' ? `Timer: ${formatTimer(remainingSecs)}` : '-',
      done: ['dimasak', 'diantar', 'selesai', 'ditolak_cod'].includes(orderStatus),
    },
    {
      id: 'diantar',
      label: 'Kurir Menuju Alamat Anda',
      time: orderStatus === 'diantar' ? 'Berlangsung' : '-',
      done: ['diantar', 'selesai', 'ditolak_cod'].includes(orderStatus),
    },
    {
      id: 'selesai',
      label:
        orderStatus === 'ditolak_cod'
          ? 'Pesanan Ditolak oleh Pembeli (COD)'
          : orderStatus === 'auto_batal_10mnt'
          ? 'Dibatalkan Otomatis oleh Sistem'
          : 'Pesanan Tiba & Terkirim (POD)',
      time: orderStatus === 'selesai' ? 'Selesai' : '-',
      done: ['selesai', 'ditolak_cod', 'auto_batal_10mnt'].includes(orderStatus),
    },
  ];

  const handleConfirmRejectCOD = async () => {
    const reasonText =
      rejectReason === 'rusak'
        ? 'Makanan rusak / kemasan hancur atau tumpah'
        : rejectReason === 'tidak_sesuai'
        ? 'Pesanan tidak sesuai dengan yang dipesan (salah menu / porsi kurang)'
        : 'Makanan basi atau dingin tidak layak konsumsi';

    if (order.idPesanan) {
      try {
        await selesaikanPesananPembeli(order.idPesanan, true);
      } catch {
        // fallback ke state lokal
      }
    }

    setRejectionSummary(reasonText + (rejectNote ? ` (${rejectNote})` : ''));
    setOrderStatus('ditolak_cod');
    setIsRejectModalOpen(false);

    showToast(
      'Pesanan COD Ditolak',
      'Pesanan berhasil ditolak. Kurir membatalkan penagihan tunai dan Anda tidak perlu membayar.',
      true
    );
  };

  const handleConfirmPesananDiterima = async () => {
    if (order.idPesanan) {
      try {
        await selesaikanPesananPembeli(order.idPesanan, false);
      } catch {
        // Abaikan jika fallback lokal
      }
    }
    setOrderStatus('selesai');
    showToast(
      'Pesanan Diterima!',
      'Status pesanan telah Selesai. Silakan berikan ulasan dan rating kepuasan Anda.'
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (order.idPesanan) {
      try {
        await kirimUlasan({
          idPesanan: order.idPesanan,
          rating: ratingStars,
          komentar: reviewNote,
          tags: selectedTags,
        });
      } catch {
        // Abaikan jika backend menolak duplikat ulasan
      }
    }
    setIsReviewSubmitted(true);
    setOrderStatus('selesai');
    showToast(
      'Pesanan Selesai!',
      'Terima kasih atas ulasan bintang Anda. Status pesanan selesai.'
    );
    if (onOrderCompleted && order) {
      onOrderCompleted(order.id);
    }
  };

  const getHeaderBadge = () => {
    if (orderStatus === 'menunggu_pembayaran') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#825100] text-xs font-bold animate-pulse">
          Menunggu Pembayaran ({statusPembayaranLive || 'Midtrans'})
        </span>
      );
    }
    if (orderStatus === 'menunggu_konfirmasi') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#a33900] text-xs font-bold animate-pulse">
          Menunggu Konfirmasi Penjual • {formatTimer(remainingSecs)}
        </span>
      );
    }
    if (orderStatus === 'dimasak') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#6ffbbe] text-[#004d33] text-xs font-bold animate-pulse">
          Sedang Disiapkan Dapur
        </span>
      );
    }
    if (orderStatus === 'auto_batal_10mnt') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold">
          Dibatalkan Otomatis
        </span>
      );
    }
    if (orderStatus === 'ditolak_cod') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold">
          Ditolak oleh Pembeli (COD)
        </span>
      );
    }
    if (orderStatus === 'selesai') {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] text-xs font-bold">
          Selesai Terkirim
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] text-xs font-bold animate-pulse">
        Dalam Pengantaran
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Title & Status Header (Boundary: halaman_status_pesanan (pembeli)) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#dee8ff]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold text-xl shadow-xs">
            <span className="material-symbols-outlined text-2xl">
              {orderStatus === 'dimasak' ? 'soup_kitchen' : orderStatus === 'menunggu_konfirmasi' ? 'hourglass_top' : 'moped'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-[#111c2d]">
                Status Pesanan #{order.orderNumber}
              </h1>
              {getHeaderBadge()}
            </div>
            <p className="text-xs text-[#5a4138] mt-0.5">
              {restaurantName} • Estimasi: <strong className="text-[#a33900]">{order.estimatedDeliveryTime}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={sinkronkanStatusDariServer}
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#f0f3ff] border border-[#dee8ff] text-xs font-bold text-[#111c2d] flex items-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          <span>Segarkan Status</span>
        </button>
      </div>

      {/* Banner: Menunggu Pembayaran Non-COD */}
      {orderStatus === 'menunggu_pembayaran' && (
        <div className="my-6 p-6 rounded-3xl bg-[#fff7ed] border-2 border-[#fdba74] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#c2410c] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#9a3412]">
                Menunggu Penyelesaian Pembayaran Midtrans
              </h2>
              <p className="text-xs text-[#5a4138] mt-1 leading-relaxed">
                Pesanan dengan metode <strong>{order.selectedProvider || 'Non-COD'}</strong> belum diteruskan ke penjual sebelum Anda menyelesaikan pembayaran.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {currentOrder?.snapToken && (
              <button
                type="button"
                onClick={handleLanjutkanPembayaranSnap}
                className="px-4 py-2.5 bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                Lanjutkan Pembayaran
              </button>
            )}
            <button
              type="button"
              disabled={checkingPayment}
              onClick={handlePeriksaStatusPembayaran}
              className="px-4 py-2.5 bg-white hover:bg-[#f0f3ff] border border-[#dee8ff] text-[#111c2d] text-xs font-bold rounded-xl transition-all"
            >
              {checkingPayment ? 'Memeriksa...' : 'Cek Status Bayar'}
            </button>
          </div>
        </div>
      )}

      {/* Banner: Menunggu Konfirmasi Penjual (Timer 10 Menit) */}
      {orderStatus === 'menunggu_konfirmasi' && (
        <div className="my-6 p-6 rounded-3xl bg-gradient-to-r from-[#fff7f4] to-[#fffbff] border-2 border-[#ffb95f] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#a33900] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl animate-pulse">hourglass_top</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#111c2d]">
                {isCOD ? 'Pesanan COD Diteruskan ke Penjual' : 'Pembayaran Lunas! Menunggu Konfirmasi Penjual'}
              </h2>
              <p className="text-xs text-[#5a4138] mt-1 leading-relaxed">
                Penjual sedang memeriksa rincian pesanan Anda. Bila penjual menekan <strong>"Terima Pesanan"</strong>, status otomatis berubah menjadi <strong>"Sedang Disiapkan"</strong>. Jika melewati batas 10 menit tanpa konfirmasi, sistem membatalkan pesanan secara otomatis.
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#ffdad6]/60 border border-[#ffb4ab] text-center shrink-0">
            <span className="text-[10px] font-bold text-[#ba1a1a] block">Batas Konfirmasi Resto</span>
            <span className="text-xl font-black font-mono text-[#ba1a1a]">
              {formatTimer(remainingSecs)}
            </span>
          </div>
        </div>
      )}

      {/* Banner: Sedang Disiapkan (Setelah Penjual Konfirmasi Pesanan) */}
      {orderStatus === 'dimasak' && (
        <div className="my-6 p-6 rounded-3xl bg-[#ecfdf5] border-2 border-[#6ee7b7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#006c49] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">soup_kitchen</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#004d33]">
                Pesanan Diterima Resto • Status: Sedang Disiapkan
              </h2>
              <p className="text-xs text-[#065f46] mt-1 leading-relaxed">
                Penjual ({restaurantName}) telah menekan <strong>"Terima Pesanan"</strong>! Hidangan Anda sedang dimasak dan akan segera diserahkan kepada kurir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner: Dibatalkan Otomatis (Alternative Flow #1 Auto Cancel) */}
      {orderStatus === 'auto_batal_10mnt' && (
        <div className="my-6 p-6 rounded-3xl bg-[#ffdad6] border-2 border-[#ffb4ab] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">event_busy</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#ba1a1a]">
                Pesanan Dibatalkan Secara Otomatis oleh Sistem
              </h2>
              <p className="text-xs text-[#111c2d] font-semibold mt-1">
                Alasan: Batas waktu tunggu konfirmasi penjual (10 menit) telah habis tanpa konfirmasi.
              </p>
              <p className="text-xs text-[#5a4138] mt-1 leading-relaxed">
                {!isCOD
                  ? `Dana pembayaran sebesar Rp ${order.total.toLocaleString('id-ID')} akan dikembalikan secara otomatis ke metode pembayaran asal.`
                  : 'Pesanan COD ini dibatalkan otomatis dan Anda tidak dikenakan biaya apa pun.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOrderCompleted) onOrderCompleted(order.id);
              onNavigateToCatalog();
            }}
            className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            Pesan Menu Baru di Katalog
          </button>
        </div>
      )}

      {/* Banner if Order is Rejected via COD */}
      {orderStatus === 'ditolak_cod' && (
        <div className="my-6 p-6 rounded-3xl bg-[#ffdad6] border-2 border-[#ffb4ab] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-2xl">cancel</span>
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#ba1a1a]">
                Pesanan Telah Ditolak oleh Pembeli (COD)
              </h2>
              <p className="text-xs text-[#111c2d] font-semibold mt-1">
                Alasan Penolakan: <span className="text-[#ba1a1a]">{rejectionSummary || 'Makanan rusak atau pesanan tidak sesuai.'}</span>
              </p>
              <p className="text-xs text-[#5a4138] mt-1 leading-relaxed">
                Kurir telah membatalkan tagihan tunai Rp {order.total.toLocaleString('id-ID')}. Anda tidak dikenakan biaya sepeser pun dan makanan dikembalikan ke pihak resto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="px-5 py-2.5 bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            Pesan Menu Baru di Katalog
          </button>
        </div>
      )}

      {/* Active Rules Info Strip */}
      <div className="my-5 p-4 rounded-2xl border flex items-start gap-3 transition-all bg-white shadow-xs">
        <span
          className={`material-symbols-outlined text-xl mt-0.5 shrink-0 ${
            isCOD ? 'text-[#a33900]' : 'text-[#006c49]'
          }`}
        >
          {isCOD ? 'verified_user' : 'lock'}
        </span>
        <div className="text-xs leading-relaxed flex-1">
          {isCOD ? (
            <>
              <strong className="text-[#a33900]">Ketentuan COD (Bayar di Tempat):</strong> Pembeli berhak memeriksa makanan saat kurir tiba. <strong>Anda dapat menolak pesanan</strong> jika makanan rusak/tumpah atau isi pesanan tidak sesuai dengan yang dipesan. Tagihan tunai kurir otomatis dibatalkan.
            </>
          ) : (
            <>
              <strong className="text-[#006c49]">Ketentuan Non-COD (E-Wallet / Transfer Bank):</strong> Pesanan ini telah lunas dibayar di muka dan <strong>tidak dapat ditolak saat serah terima</strong>. Jika ada kendala fisik atau salah menu, silakan laporkan via ulasan bintang atau hubungi Pusat Bantuan MakanDulu untuk klaim pengembalian dana.
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
        {/* Left Column: Live Map Visual & Courier Details (Col-7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Interactive Simulated Map */}
          <div className="relative w-full h-80 rounded-3xl overflow-hidden bg-[#cfdaf2] border border-[#dee8ff] shadow-sm flex flex-col justify-between p-4">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#a33900_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 100 240 Q 250 80 480 180"
                fill="none"
                stroke={orderStatus === 'ditolak_cod' ? '#ba1a1a' : '#a33900'}
                strokeWidth="4"
                strokeDasharray="8 6"
                className={orderStatus === 'ditolak_cod' ? '' : 'animate-pulse'}
              />
            </svg>

            <div className="relative z-10 flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#111c2d] text-xs font-bold shadow-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#006c49]">navigation</span>
                {orderStatus === 'ditolak_cod'
                  ? 'Pengantaran dibatalkan (Pesanan ditolak)'
                  : orderStatus === 'auto_batal_10mnt'
                  ? 'Dibatalkan Otomatis (Batas 10 Menit Habis)'
                  : orderStatus === 'menunggu_pembayaran'
                  ? 'Menunggu pembayaran Midtrans selesai'
                  : orderStatus === 'menunggu_konfirmasi'
                  ? 'Pesanan menunggu konfirmasi Penjual'
                  : orderStatus === 'dimasak'
                  ? 'Dapur resto sedang menyiapkan makanan Anda'
                  : 'Kurir berjarak 600m dari lokasi Anda'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#cc4900] text-white text-[11px] font-bold shadow-sm">
                Live Order Tracker
              </span>
            </div>

            <div className="relative z-10 flex items-center justify-between px-8">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center font-bold shadow-md border-2 border-white">
                  <span className="material-symbols-outlined text-lg">store</span>
                </div>
                <span className="text-[11px] font-bold text-[#111c2d] bg-white/90 px-2 py-0.5 rounded shadow-xs mt-1 max-w-[120px] truncate">
                  {restaurantName}
                </span>
              </div>

              <div className={`flex flex-col items-center ${orderStatus === 'diantar' ? 'animate-bounce' : ''}`}>
                <div
                  className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-xl border-3 border-white ring-4 ${
                    orderStatus === 'ditolak_cod' || orderStatus === 'auto_batal_10mnt'
                      ? 'bg-[#ba1a1a] ring-[#ba1a1a]/25'
                      : orderStatus === 'dimasak'
                      ? 'bg-[#006c49] ring-[#006c49]/25'
                      : 'bg-[#a33900] ring-[#a33900]/25'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {orderStatus === 'ditolak_cod' || orderStatus === 'auto_batal_10mnt'
                      ? 'cancel'
                      : orderStatus === 'dimasak'
                      ? 'soup_kitchen'
                      : orderStatus === 'menunggu_konfirmasi'
                      ? 'hourglass_top'
                      : 'two_wheeler'}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm mt-1 ${
                    orderStatus === 'ditolak_cod' || orderStatus === 'auto_batal_10mnt'
                      ? 'bg-[#ba1a1a]'
                      : orderStatus === 'dimasak'
                      ? 'bg-[#006c49]'
                      : 'bg-[#a33900]'
                  }`}
                >
                  {orderStatus === 'ditolak_cod'
                    ? 'Retur ke Resto'
                    : orderStatus === 'auto_batal_10mnt'
                    ? 'Batal Otomatis'
                    : orderStatus === 'menunggu_pembayaran'
                    ? 'Belum Bayar'
                    : orderStatus === 'menunggu_konfirmasi'
                    ? 'Menunggu Resto'
                    : orderStatus === 'dimasak'
                    ? 'Sedang Disiapkan'
                    : 'Pak Ahmad (2 mnt)'}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-2xl bg-[#6ffbbe] text-[#002113] flex items-center justify-center font-bold shadow-md border-2 border-white">
                  <span className="material-symbols-outlined text-lg">home_pin</span>
                </div>
                <span className="text-[11px] font-bold text-[#111c2d] bg-white/90 px-2 py-0.5 rounded shadow-xs mt-1 max-w-[130px] truncate">
                  {order.address.street}
                </span>
              </div>
            </div>

            <div className="relative z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between border border-[#dee8ff] shadow-sm">
              <div className="flex items-center gap-3">
                <img
                  src={COURIER_AVATAR_URL}
                  alt={order.driverName}
                  className="w-10 h-10 rounded-full object-cover border border-[#dee8ff]"
                />
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#111c2d]">{order.driverName}</span>
                    <span className="text-[10px] text-amber-500 font-bold flex items-center">
                      ★ {order.driverRating}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#5a4138]">{order.driverPlate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast('Menghubungi Driver', `Memanggil ${order.driverName} (${order.driverPhone})...`)}
                  className="px-3 py-1.5 rounded-xl bg-[#e7eeff] hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">call</span>
                  <span>Telepon</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Chat Dibuka', `Kirim pesan ke ${order.driverName}`)}
                  className="px-3 py-1.5 rounded-xl bg-[#006c49] text-white hover:bg-[#005236] text-xs font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  <span>Chat</span>
                </button>
              </div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#dee8ff]">
            <h2 className="text-sm font-bold text-[#111c2d] mb-4">
              Status Perjalanan Makanan
            </h2>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        (orderStatus === 'ditolak_cod' || orderStatus === 'auto_batal_10mnt') && idx === steps.length - 1
                          ? 'bg-[#ba1a1a] text-white'
                          : step.done
                          ? 'bg-[#006c49] text-white'
                          : 'bg-[#f0f3ff] text-[#5a4138] border border-[#dee8ff]'
                      }`}
                    >
                      {(orderStatus === 'ditolak_cod' || orderStatus === 'auto_batal_10mnt') && idx === steps.length - 1
                        ? '✕'
                        : step.done
                        ? '✓'
                        : idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-8 my-1 ${
                          step.done ? 'bg-[#006c49]' : 'bg-[#dee8ff]'
                        }`}
                      ></div>
                    )}
                  </div>
                  <div className="flex-1 flex justify-between items-center pt-0.5">
                    <span
                      className={`text-xs ${
                        (orderStatus === 'ditolak_cod' || orderStatus === 'auto_batal_10mnt') && idx === steps.length - 1
                          ? 'font-bold text-[#ba1a1a]'
                          : step.done
                          ? 'font-bold text-[#111c2d]'
                          : 'text-[#5a4138]'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[11px] font-mono text-[#5a4138]">{step.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Proof of Delivery (POD) thumbnail when completed */}
            {orderStatus === 'selesai' && (
              <div className="mt-6 p-4 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={POD_PHOTO_URL}
                    alt="Proof of delivery"
                    className="w-14 h-14 rounded-xl object-cover border border-[#dee8ff]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#111c2d] block">
                      Bukti Foto Serah Terima (POD)
                    </span>
                    <span className="text-[11px] text-[#5a4138]">
                      Diterima di meja resepsionis • 13:05 WIB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPodModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-white text-[#a33900] text-xs font-bold hover:bg-[#dee8ff] border border-[#dee8ff]"
                >
                  Lihat Foto
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Details & Actions (TOLAK COD vs NON-COD) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Order Summary Card */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#dee8ff]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
              <span className="text-sm font-bold text-[#111c2d]">Ringkasan Tagihan</span>
              <span className="text-sm font-extrabold text-[#a33900]">
                Rp {order.total.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="divide-y divide-[#f0f3ff] my-2">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-[#111c2d]">
                      {item.qty}x {item.name}
                    </span>
                    <span className="block text-[11px] text-[#5a4138]">{item.sublabel}</span>
                  </div>
                  <span className="text-xs font-bold text-[#111c2d]">
                    Rp {(item.price * item.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#f0f3ff] text-[11px] text-[#5a4138] space-y-1.5">
              <div className="flex justify-between">
                <span>Alamat Antar:</span>
                <span className="font-bold text-[#111c2d] text-right max-w-[200px]">
                  {order.address.street}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Metode Pembayaran:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    isCOD
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : 'bg-[#6ffbbe]/40 text-[#006c49]'
                  }`}
                >
                  {order.selectedProvider || (isCOD ? 'COD (Bayar Tunai di Tempat)' : 'Non-COD (Lunas Terbayar)')}
                </span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* ACTION AREA: TOLAK PESANAN UNTUK COD vs TIDAK BISA TOLAK UNTUK NON-COD */}
            {/* ========================================================================= */}
            <div className="mt-5 pt-4 border-t border-[#dee8ff]/80">
              {isCOD ? (
                /* Pembayaran COD: BISA MENOLAK PESANAN */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111c2d]">Aksi Pembeli (COD):</span>
                    <span className="text-[10px] text-[#006c49] font-bold">Bebas Biaya Retur</span>
                  </div>

                  {orderStatus !== 'ditolak_cod' ? (
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="w-full py-3 rounded-2xl bg-[#ffdad6] hover:bg-[#ffb4ab] text-[#ba1a1a] text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#ffb4ab] shadow-xs active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      <span>Tolak Pesanan COD (Makanan Rusak / Salah)</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold text-center border border-[#ffb4ab]">
                      Pesanan Ini Telah Ditolak oleh Anda
                    </div>
                  )}

                  <p className="text-[10px] text-[#5a4138] leading-tight">
                    *Karena Anda memilih metode COD, Anda dapat menolak pesanan jika makanan rusak atau salah menu saat kurir tiba tanpa kewajiban membayar.
                  </p>
                </div>
              ) : (
                /* Pembayaran Non-COD: TIDAK BISA MENOLAK PESANAN */
                <div className="p-3.5 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#5a4138]">
                    <span className="material-symbols-outlined text-sm text-[#006c49]">lock</span>
                    <span>Pesanan Non-COD Tidak Dapat Ditolak</span>
                  </div>
                  <p className="text-[11px] text-[#5a4138] leading-relaxed">
                    Pesanan dengan metode pembayaran Non-COD ({order.selectedProvider || 'E-Wallet / Transfer Bank'}) telah lunas terbayar dan tidak dapat ditolak saat kurir tiba.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      showToast(
                        'Pusat Bantuan',
                        'Jika ada menu rusak atau salah pada pesanan Non-COD, laporkan melalui CS MakanDulu untuk pengembalian dana.'
                      )
                    }
                    className="text-[11px] font-bold text-[#a33900] hover:underline block pt-1"
                  >
                    Pelajari Prosedur Klaim Dana Non-COD →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FITUR RATING & ULASAN: HANYA TAMPIL SETELAH PESANAN DITERIMA OLEH PEMBELI */}
          {/* ========================================================================= */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#dee8ff]">
            {orderStatus !== 'selesai' ? (
              /* Status Sebelum Pesanan Diterima: FITUR RATING DIKUNCI */
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f0f3ff] text-[#5a4138] flex items-center justify-center mx-auto border border-[#dee8ff]">
                  <span className="material-symbols-outlined text-2xl text-[#a33900]">lock</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#111c2d]">
                    Ulasan & Rating Belum Tersedia
                  </h2>
                  <p className="text-xs text-[#5a4138] mt-1 leading-relaxed max-w-sm mx-auto">
                    Fitur ulasan dan penilaian bintang baru dapat diberikan <strong>setelah pesanan tiba dan telah Anda terima</strong>.
                  </p>
                </div>

                {orderStatus !== 'ditolak_cod' &&
                  orderStatus !== 'auto_batal_10mnt' &&
                  orderStatus !== 'menunggu_pembayaran' &&
                  orderStatus !== 'menunggu_konfirmasi' && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPesananDiterima}
                      className="w-full py-3 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Konfirmasi Pesanan Telah Diterima</span>
                    </button>
                    <span className="text-[10px] text-[#5a4138] block mt-1.5">
                      Klik tombol di atas jika kurir telah menyerahkan pesanan kepada Anda
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Status SETELAH Pesanan Diterima: FORM ULASAN & RATING TERBUKA */
              <>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#dee8ff]/60">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-2xl">
                      hotel_class
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-[#111c2d]">
                        Beri Ulasan Kuliner & Driver
                      </h2>
                      <span className="text-[10px] text-[#006c49] font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Pesanan Telah Diterima
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#5a4138] mb-4">
                  Bagikan pengalaman bersantap Anda untuk membantu resto dan kurir meningkatkan pelayanan.
                </p>

                {!isReviewSubmitted ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="flex items-center justify-center gap-2 py-2 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingStars(star)}
                          className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                        >
                          <span
                            className={`material-symbols-outlined ${
                              star <= ratingStars ? 'text-amber-500 fill-1' : 'text-gray-300'
                            }`}
                          >
                            star
                          </span>
                        </button>
                      ))}
                      <span className="text-xs font-bold text-[#111c2d] ml-2">
                        {ratingStars}.0 / 5.0
                      </span>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-[#111c2d] mb-2 block">
                        Apa yang Anda sukai?
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Rasa Mantap',
                          'Masih Hangat',
                          'Porsi Pas',
                          'Pengemasan Rapi',
                          'Pedas Pas',
                          'Kurir Sopan'
                        ].map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                setSelectedTags((prev) =>
                                  isSelected ? prev.filter((t) => t !== tag) : [...prev, tag]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                isSelected
                                  ? 'bg-[#cc4900] text-white shadow-xs'
                                  : 'bg-[#f0f3ff] text-[#111c2d] hover:bg-[#dee8ff]'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Ceritakan Cita Rasa Sajian Ini
                      </label>
                      <textarea
                        rows={3}
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Tulis ulasan Anda mengenai rasa bumbu, tingkat kematangan, atau kesegaran sambal..."
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff] resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#a33900] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#cc4900] transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">send</span>
                      <span>Kirim Ulasan Kuliner</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-6 rounded-3xl bg-[#6ffbbe]/25 text-center space-y-3 border-2 border-[#006c49]/30">
                    <div className="w-14 h-14 rounded-full bg-[#006c49] text-white flex items-center justify-center mx-auto shadow-sm">
                      <span className="material-symbols-outlined text-3xl">task_alt</span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-[#111c2d]">Pesanan Telah Selesai!</h4>
                      <p className="text-xs text-[#004d33] font-bold mt-0.5">Ulasan Bintang {ratingStars} Berhasil Disimpan</p>
                    </div>
                    <p className="text-xs text-[#5a4138] max-w-md mx-auto leading-relaxed">
                      Terima kasih telah mengonfirmasi penerimaan hidangan. Saat ini <strong>sudah tidak ada pesanan yang sedang diantar</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onOrderCompleted && order) {
                          onOrderCompleted(order.id);
                        }
                        onNavigateToCatalog();
                      }}
                      className="mt-3 px-6 py-2.5 bg-[#cc4900] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#a33900] transition-all flex items-center justify-center gap-2 mx-auto active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">restaurant_menu</span>
                      <span>Kembali ke Katalog Menu</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DIALOG: PENOLAKAN PESANAN COD (HANYA UNTUK COD) */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#dee8ff] flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">cancel</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111c2d]">Tolak Pesanan COD</h3>
                  <span className="text-xs text-[#ba1a1a] font-semibold">Penolakan Serah Terima Tunai</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#5a4138] hover:text-[#111c2d]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <p className="text-xs text-[#5a4138] leading-relaxed">
              Anda berhak menolak pesanan COD jika makanan rusak atau tidak sesuai dengan pesanan. Silakan tentukan alasan penolakan:
            </p>

            {/* Pilihan Alasan Penolakan */}
            <div className="space-y-2.5">
              {[
                {
                  id: 'rusak',
                  title: 'Makanan Rusak / Kemasan Tumpah',
                  desc: 'Kemasan rusak, kuah tumpah berantakan, atau fisik makanan hancur saat tiba.'
                },
                {
                  id: 'tidak_sesuai',
                  title: 'Pesanan Tidak Sesuai (Salah Menu)',
                  desc: 'Menu yang diantar berbeda dari yang dipesan di keranjang atau porsi kurang.'
                },
                {
                  id: 'basi',
                  title: 'Kualitas Makanan Tidak Layak (Basi / Dingin)',
                  desc: 'Kondisi makanan basi, berbau tidak sedap, atau tidak higienis.'
                }
              ].map((item) => (
                <label
                  key={item.id}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    rejectReason === item.id
                      ? 'border-[#ba1a1a] bg-[#ffdad6]/30 ring-1 ring-[#ba1a1a]'
                      : 'border-[#dee8ff] bg-[#f9f9ff] hover:bg-[#f0f3ff]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reject_reason_choice"
                    value={item.id}
                    checked={rejectReason === item.id}
                    onChange={() => setRejectReason(item.id as any)}
                    className="accent-[#ba1a1a] mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#111c2d] block">{item.title}</span>
                    <span className="text-[11px] text-[#5a4138] block mt-0.5">{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                Catatan Tambahan untuk Kurir & Resto (Opsional)
              </label>
              <input
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Contoh: Sambal tumpah ke nasi dan bungkus robek..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] outline-none focus:ring-2 focus:ring-[#ba1a1a]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f0f3ff]">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-[#111c2d] text-xs font-bold hover:bg-[#dee8ff]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectCOD}
                className="px-5 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#93000a] shadow-md transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                <span>Konfirmasi Penolakan Pesanan COD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery Photo Modal */}
      {isPodModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-[#dee8ff] flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f3ff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49]">photo_camera</span>
                <span className="text-sm font-bold text-[#111c2d]">Foto Bukti Penerimaan (POD)</span>
              </div>
              <button
                onClick={() => setIsPodModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#5a4138] hover:text-[#111c2d]"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="w-full h-64 rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={POD_PHOTO_URL}
                alt="Proof of delivery full"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-xs text-[#5a4138] space-y-1">
              <p>• Diterima: Resepsionis Gedung B Lt. 3</p>
              <p>• Tanggal: Hari ini, 13:05 WIB</p>
              <p>• Kurir: Pak Ahmad Fauzi (B 4821 KOP)</p>
            </div>
            <button
              onClick={() => setIsPodModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#a33900] text-white text-xs font-bold shadow-xs hover:bg-[#cc4900]"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const LiveTrackingView = PelacakanPesanan;
export const TampilanPelacakanPesanan = PelacakanPesanan;
export default PelacakanPesanan;
