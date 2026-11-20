import React, { useState } from 'react';
import { OrderRecord } from '../types';
import HalamanFormBuktiPengantaran from './halaman_form_bukti_pengantaran';

interface HalamanDetailPesananProps {
  order: OrderRecord;
  onUpdateStatus: (orderId: string, newStatus: OrderRecord['status']) => void;
  onBack: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanDetailPesanan: React.FC<HalamanDetailPesananProps> = ({
  order,
  onUpdateStatus,
  onBack,
  showToast
}) => {
  const [showPodModal, setShowPodModal] = useState(false);

  const handleNextStatus = () => {
    if (order.status === 'dimasak') {
      onUpdateStatus(order.id, 'diantar');
      showToast('Kurir Dipanggil', 'Notifikasi serah terima hidangan terkirim ke kurir.');
    } else if (order.status === 'diantar') {
      setShowPodModal(true);
    }
  };

  const handleSavePod = (podUrl: string) => {
    setShowPodModal(false);
    onUpdateStatus(order.id, 'selesai');
    showToast('Pesanan Selesai!', 'Bukti serah terima tersimpan dan pesanan ditutup.');
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-[#111c2d]">
              Detail Pesanan #{order.orderNumber}
            </h1>
            <p className="text-xs text-[#5a4138]">
              Waktu Pesan: {order.orderTime} • Metode: <strong className="uppercase">{order.paymentMethod}</strong>
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#ffddb8] text-[#825100] text-xs font-bold capitalize">
          Status: {order.status}
        </span>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-5">
        <div>
          <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider mb-2">
            Informasi Pemesan & Lokasi Antar
          </h3>
          <div className="p-3.5 bg-[#f9f9ff] rounded-2xl border border-[#dee8ff] space-y-1 text-xs">
            <p className="font-bold text-[#111c2d]">Alamat Pengantaran: {order.address.label || 'Pelanggan'}</p>
            <p className="text-[#5a4138]">{order.address.street}</p>
            <p className="text-[#5a4138]">{order.address.details}</p>
            {order.address.notes && (
              <p className="text-[#a33900] font-medium italic">Catatan: {order.address.notes}</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider mb-2">
            Daftar Hidangan yang Harus Disiapkan
          </h3>
          <div className="divide-y divide-[#f0f3ff]">
            {order.items.map((it) => (
              <div key={it.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-[#111c2d] text-sm">
                    {it.qty}x {it.name}
                  </span>
                  {it.sublabel && (
                    <span className="text-[11px] text-[#a33900] block italic mt-0.5">
                      Catatan Dapur: {it.sublabel}
                    </span>
                  )}
                </div>
                <span className="font-black text-[#111c2d]">
                  Rp {(it.price * it.qty).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#dee8ff] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#5a4138] block">Total Tagihan Pesanan:</span>
            <span className="text-xl font-black text-[#825100]">
              Rp {order.total.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {order.status === 'dimasak' && (
              <button
                type="button"
                onClick={handleNextStatus}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">moped</span>
                <span>Makanan Selesai Dimasak (Panggil Kurir)</span>
              </button>
            )}

            {order.status === 'diantar' && (
              <button
                type="button"
                onClick={() => setShowPodModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">task_alt</span>
                <span>Unggah Bukti Penerimaan (Selesai)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal POD */}
      {showPodModal && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <HalamanFormBuktiPengantaran
            orderNumber={order.orderNumber}
            onSaveProof={handleSavePod}
            onCancel={() => setShowPodModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default HalamanDetailPesanan;
