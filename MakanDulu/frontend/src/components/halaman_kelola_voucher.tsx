import React, { useState } from 'react';
import { Voucher } from '../types';
import { AVAILABLE_VOUCHERS } from '../data/dataMock';
import FormulirVoucher from './formulir_voucher';
import PopupKonfirmasiHapus from './pop_up_konfirmasi_hapus';

interface HalamanKelolaVoucherProps {
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanKelolaVoucher: React.FC<HalamanKelolaVoucherProps> = ({ showToast }) => {
  const [vouchers, setVouchers] = useState<Voucher[]>(AVAILABLE_VOUCHERS);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  const handleSaveVoucher = (saved: Voucher) => {
    if (editingVoucher) {
      setVouchers((prev) => prev.map((v) => (v.id === saved.id ? saved : v)));
      showToast('Voucher Diperbarui', `Voucher ${saved.code} berhasil diperbarui.`);
    } else {
      setVouchers((prev) => [saved, ...prev]);
      showToast('Voucher Dibuat!', `Voucher ${saved.code} siap digunakan pembeli.`);
    }
    setShowFormModal(false);
    setEditingVoucher(null);
  };

  const handleToggleActive = (id: string) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const newState = v.isActive === false ? true : false;
          showToast(
            newState ? 'Voucher Diaktifkan' : 'Voucher Dinonaktifkan',
            `Kode ${v.code} kini ${newState ? 'bisa' : 'tidak bisa'} digunakan.`
          );
          return { ...v, isActive: newState };
        }
        return v;
      })
    );
  };

  const handleConfirmDelete = () => {
    if (voucherToDelete) {
      setVouchers((prev) => prev.filter((v) => v.id !== voucherToDelete.id));
      showToast('Voucher Dihapus', `Kode ${voucherToDelete.code} telah dihapus.`);
      setVoucherToDelete(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="material-symbols-outlined text-[#825100] text-2xl">loyalty</span>
            <h1 className="text-xl font-black text-[#111c2d]">Kelola Voucher & Promo Resto</h1>
          </div>
          <p className="text-xs text-[#5a4138]">
            Buat kupon promosi untuk meningkatkan omzet dan menarik lebih banyak pesanan pelanggan
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingVoucher(null);
            setShowFormModal(true);
          }}
          className="px-5 py-3 rounded-2xl bg-[#825100] hover:bg-[#a36700] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 shrink-0 active:scale-95"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          <span>+ Buat Voucher Baru</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#dee8ff] shadow-2xs">
          <span className="text-[11px] text-[#5a4138] block font-semibold">Total Voucher Aktif</span>
          <span className="text-xl font-black text-[#006c49]">
            {vouchers.filter((v) => v.isActive !== false).length} Kupon
          </span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#dee8ff] shadow-2xs">
          <span className="text-[11px] text-[#5a4138] block font-semibold">Rata-rata Nilai Diskon</span>
          <span className="text-xl font-black text-[#825100]">25% Hemat</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#dee8ff] shadow-2xs">
          <span className="text-[11px] text-[#5a4138] block font-semibold">Voucher Paling Diminati</span>
          <span className="text-xl font-black text-[#a33900]">MAKANHEMAT35</span>
        </div>
      </div>

      {/* Voucher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {vouchers.map((v) => {
          const isActive = v.isActive !== false;
          return (
            <div
              key={v.id}
              className={`rounded-3xl bg-white border p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md ${
                isActive ? 'border-[#dee8ff]' : 'border-[#cfdaf2] bg-gray-50 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 rounded-full bg-[#ffdbce] text-[#a33900] font-mono font-black text-xs tracking-wider">
                    {v.code}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#6ffbbe]/30 text-[#004d33]' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-[#111c2d] line-clamp-1">{v.title}</h3>
                <p className="text-[11px] text-[#5a4138] line-clamp-2 mt-1 leading-relaxed">
                  {v.description}
                </p>

                <div className="mt-3.5 space-y-1 text-[11px] text-[#5a4138] bg-[#f9f9ff] p-2.5 rounded-xl border border-[#dee8ff]/60">
                  <div className="flex justify-between">
                    <span>Min. Belanja:</span>
                    <span className="font-bold text-[#111c2d]">Rp {v.minSpend.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Berlaku:</span>
                    <span className="font-medium text-[#111c2d]">{v.expiryDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tipe Potongan:</span>
                    <span className="font-bold text-[#825100] capitalize">{v.discountType}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#f0f3ff] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleActive(v.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    isActive
                      ? 'bg-white border-[#dee8ff] text-[#5a4138] hover:bg-[#f0f3ff]'
                      : 'bg-[#006c49] text-white border-[#006c49]'
                  }`}
                >
                  {isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVoucher(v);
                      setShowFormModal(true);
                    }}
                    className="p-1.5 rounded-xl text-[#5a4138] hover:text-[#825100] hover:bg-[#ffddb8]/30 transition-colors"
                    title="Edit voucher"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherToDelete(v)}
                    className="p-1.5 rounded-xl text-[#5a4138] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                    title="Hapus voucher"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Formulir Voucher */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#dee8ff]">
            <FormulirVoucher
              initialVoucher={editingVoucher}
              onSave={handleSaveVoucher}
              onCancel={() => {
                setShowFormModal(false);
                setEditingVoucher(null);
              }}
              showToast={showToast}
            />
          </div>
        </div>
      )}

      {/* Popup Konfirmasi Hapus */}
      <PopupKonfirmasiHapus
        isOpen={Boolean(voucherToDelete)}
        title={voucherToDelete?.code || ''}
        itemType="voucher"
        onConfirm={handleConfirmDelete}
        onCancel={() => setVoucherToDelete(null)}
      />
    </div>
  );
};

export default HalamanKelolaVoucher;
