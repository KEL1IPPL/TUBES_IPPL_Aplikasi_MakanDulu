import React, { useState } from 'react';
import { OrderRecord } from '../types';
import FormUlasan from './form_ulasan';

interface HalamanStatusPesananPembeliProps {
  currentOrder: OrderRecord | null;
  onNavigateToCatalog: () => void;
  onOrderCompleted: (orderId: string) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanStatusPesananPembeli: React.FC<HalamanStatusPesananPembeliProps> = ({
  currentOrder,
  onNavigateToCatalog,
  onOrderCompleted,
  showToast
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isReceived, setIsReceived] = useState(false);
  const [isCodRejected, setIsCodRejected] = useState(false);

  if (!currentOrder) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#dee8ff] shadow-sm space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-[#6ffbbe]/20 text-[#006c49] flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>
        <h2 className="text-xl font-black text-[#111c2d]">Tidak Ada Pesanan yang Sedang Diantar</h2>
        <p className="text-xs text-[#5a4138] max-w-md mx-auto">
          Semua pesanan Anda telah selesai dan diterima dengan baik. Buka katalog untuk memesan menu lezat lainnya!
        </p>
        <button
          type="button"
          onClick={onNavigateToCatalog}
          className="px-6 py-3 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">restaurant_menu</span>
          <span>Buka Katalog Makanan</span>
        </button>
      </div>
    );
  }

  const steps = [
    { label: 'Pesanan Diterima Resto', time: currentOrder.orderTime, done: true },
    { label: 'Dapur Menyiapkan Makanan', time: '10 mnt lalu', done: true },
    { label: 'Kurir Menuju Alamat Anda', time: 'Sedang Berlangsung', done: !isReceived },
    { label: 'Pesanan Diterima & Selesai', time: isReceived ? 'Selesai' : 'Estimasi 10 mnt', done: isReceived }
  ];

  const handleConfirmReceived = () => {
    setIsReceived(true);
    setShowReviewForm(true);
    showToast('Pesanan Diterima!', 'Silakan berikan rating dan ulasan hidangan.');
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    showToast('Ulasan Dikirimkan!', 'Terima kasih telah memberikan ulasan hidangan.');
    onOrderCompleted(currentOrder.id);
  };

  const handleCodReject = () => {
    setIsCodRejected(true);
    showToast('Pesanan Ditolak', 'Pesanan COD ditolak dan dikembalikan ke pihak resto.', true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Tracker */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-3 h-3 rounded-full bg-[#006c49] animate-pulse" />
            <h1 className="text-xl font-black text-[#111c2d]">
              Status Pengantaran Pesanan #{currentOrder.orderNumber}
            </h1>
          </div>
          <p className="text-xs text-[#5a4138]">
            Resto Mitra: <strong className="text-[#a33900]">{currentOrder.items[0]?.restaurant}</strong> • Estimasi Tiba: <strong className="text-[#006c49]">{currentOrder.estimatedDeliveryTime}</strong>
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#6ffbbe]/30 text-[#004d33] text-xs font-black">
          {isReceived ? 'Selesai' : isCodRejected ? 'Ditolak (COD)' : 'Sedang Diantar'}
        </span>
      </div>

      {/* Progress Timeline Stepper */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm">
        <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider mb-5">
          Perjalanan Pesanan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {steps.map((st, i) => (
            <div key={i} className="flex flex-col items-center text-center relative">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                st.done
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'bg-[#f0f3ff] text-[#5a4138] border border-[#dee8ff]'
              }`}>
                {st.done ? '✓' : i + 1}
              </div>
              <span className="text-xs font-bold text-[#111c2d] leading-snug">{st.label}</span>
              <span className="text-[10px] text-[#5a4138] mt-0.5">{st.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Info Kurir & Map Visual (Col-7) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Map Simulation Visual */}
          <div className="h-64 rounded-3xl bg-[#e7eeff] border border-[#dee8ff] relative overflow-hidden flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-bold text-[#111c2d] shadow-xs">
                Live GPS Kurir • 600m Menuju Lokasi
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#a33900] text-white text-[10px] font-bold">
                MakanDulu Express
              </span>
            </div>

            <div className="flex items-center justify-between px-6">
              <div className="w-12 h-12 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-2xl">store</span>
              </div>
              <div className="flex-1 px-4 flex items-center">
                <div className="w-full border-t-2 border-dashed border-[#a33900] relative">
                  <span className="material-symbols-outlined text-[#a33900] absolute left-1/2 -top-3 text-xl animate-bounce">
                    moped
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-2xl">home</span>
              </div>
            </div>

            <p className="text-[11px] text-[#5a4138] text-center font-medium">
              Alamat Tujuan: {currentOrder.address.street}
            </p>
          </div>

          {/* Profil Driver */}
          <div className="bg-white rounded-3xl p-5 border border-[#dee8ff] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f0f3ff] text-[#a33900] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">sports_motorsports</span>
              </div>
              <div>
                <span className="text-xs font-black text-[#111c2d] block">{currentOrder.driverName}</span>
                <span className="text-[11px] text-[#5a4138] block">{currentOrder.driverPlate}</span>
                <span className="text-[10px] text-amber-500 font-bold">★ {currentOrder.driverRating}</span>
              </div>
            </div>

            <a
              href={`tel:${currentOrder.driverPhone}`}
              className="px-4 py-2 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-xs font-bold text-[#111c2d] flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-base">call</span>
              <span>Hubungi Kurir</span>
            </a>
          </div>
        </div>

        {/* Actions & Rincian Pembayaran (Col-5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Action Card: Terima Pesanan */}
          <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider pb-2 border-b border-[#f0f3ff]">
              Konfirmasi Penerimaan Hidangan
            </h3>
            <p className="text-xs text-[#5a4138] leading-relaxed">
              Jika kurir telah tiba dan menyerahkan pesanan dalam kondisi baik, tekan tombol di bawah untuk menyelesaikan status pesanan.
            </p>

            <button
              type="button"
              disabled={isReceived}
              onClick={handleConfirmReceived}
              className={`w-full py-3.5 px-5 rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 ${
                isReceived
                  ? 'bg-[#006c49] text-white cursor-default'
                  : 'bg-[#006c49] hover:bg-[#005236] text-white active:scale-95'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isReceived ? 'check_circle' : 'task_alt'}
              </span>
              <span>{isReceived ? 'Pesanan Telah Diterima' : 'Pesanan Telah Diterima'}</span>
            </button>

            {currentOrder.paymentMethod === 'cod' && !isReceived && !isCodRejected && (
              <button
                type="button"
                onClick={handleCodReject}
                className="w-full py-2.5 rounded-xl bg-white border border-[#ba1a1a] text-[#ba1a1a] text-xs font-bold hover:bg-[#ffdad6] transition-colors"
              >
                Tolak Pesanan (Khusus COD Rusak/Salah)
              </button>
            )}
          </div>

          {/* Rincian Menu Singkat */}
          <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider pb-2 border-b border-[#f0f3ff]">
              Total Tagihan Pesanan
            </h3>
            <div className="space-y-1.5 text-xs text-[#5a4138]">
              {currentOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span>{it.qty}x {it.name}</span>
                  <span className="font-bold text-[#111c2d]">Rp {(it.price * it.qty).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#dee8ff] flex justify-between font-bold text-[#111c2d]">
                <span>Metode Pembayaran</span>
                <span className="capitalize">{currentOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-[#a33900] pt-1">
                <span>Total Lunas</span>
                <span>Rp {currentOrder.total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Form Ulasan */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#dee8ff]">
            <FormUlasan
              orderNumber={currentOrder.orderNumber}
              restaurantName={currentOrder.items[0]?.restaurant || 'Resto Mitra'}
              onSubmitReview={handleReviewSubmitted}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HalamanStatusPesananPembeli;
