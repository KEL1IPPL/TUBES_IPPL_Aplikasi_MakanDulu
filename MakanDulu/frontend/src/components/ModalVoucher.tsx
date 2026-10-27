import React, { useState } from 'react';
import { Voucher } from '../types';
import { AVAILABLE_VOUCHERS } from '../data/dataMock';

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoucher: Voucher | null;
  onApplyVoucher: (voucher: Voucher | null) => void;
  subtotal: number;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  selectedVoucher,
  onApplyVoucher,
  subtotal,
  showToast
}) => {
  const [customCode, setCustomCode] = useState('');
  const [tempSelected, setTempSelected] = useState<Voucher | null>(selectedVoucher);

  if (!isOpen) return null;

  const handleApplyCustomCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = customCode.trim().toUpperCase();
    if (!cleanCode) {
      showToast('Kode Kosong', 'Masukkan kode voucher terlebih dahulu.', true);
      return;
    }

    const matched = AVAILABLE_VOUCHERS.find(
      (v) => v.code.toUpperCase() === cleanCode
    );

    if (matched) {
      if (subtotal < matched.minSpend) {
        showToast(
          'Syarat Belanja Belum Cukup',
          `Minimal belanja untuk kode ${matched.code} adalah Rp ${matched.minSpend.toLocaleString('id-ID')}. Total pesanan Anda: Rp ${subtotal.toLocaleString('id-ID')}.`,
          true
        );
        return;
      }
      setTempSelected(matched);
      onApplyVoucher(matched);
      onClose();
      showToast('Voucher Berhasil Digunakan!', `Kode ${matched.code} aktif memotong pembayaran.`);
    } else {
      showToast(
        'Voucher Tidak Ditemukan',
        `Kode voucher '${cleanCode}' tidak valid atau sudah kadaluarsa. Coba pilih voucher yang tersedia di bawah.`,
        true
      );
    }
  };

  const calculateDiscountPreview = (voucher: Voucher): number => {
    if (voucher.discountType === 'shipping') {
      return voucher.discountValue;
    }
    if (voucher.discountType === 'fixed') {
      return Math.min(voucher.discountValue, subtotal);
    }
    if (voucher.discountType === 'percentage') {
      const calculated = Math.round((subtotal * voucher.discountValue) / 100);
      return voucher.maxDiscount ? Math.min(calculated, voucher.maxDiscount) : calculated;
    }
    return 0;
  };

  const handleConfirmSelection = () => {
    onApplyVoucher(tempSelected);
    if (tempSelected) {
      const discountAmount = calculateDiscountPreview(tempSelected);
      showToast(
        'Voucher Diterapkan!',
        `Voucher ${tempSelected.code} berhasil dipasang! Hemat Rp ${discountAmount.toLocaleString('id-ID')}.`
      );
    } else {
      showToast('Voucher Dilepas', 'Potongan diskon voucher telah dihapus.');
    }
    onClose();
  };

  const handleRemoveVoucher = () => {
    setTempSelected(null);
    onApplyVoucher(null);
    showToast('Voucher Dihapus', 'Voucher belanja tidak digunakan.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dee8ff] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dee8ff]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl">confirmation_number</span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111c2d]">Pilih Voucher Promo</h3>
              <p className="text-xs text-[#5a4138]">Gunakan voucher untuk hemat biaya makan & ongkir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f0f3ff] text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff] transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Custom Voucher Input Form */}
        <form onSubmit={handleApplyCustomCode} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-base">
              sell
            </span>
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              placeholder="Masukkan kode promo (contoh: MAKANHEMAT35)..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#f0f3ff] text-xs font-mono font-bold text-[#111c2d] border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none uppercase placeholder:font-sans placeholder:normal-case placeholder:font-normal"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#111c2d] hover:bg-[#263143] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
          >
            Terapkan
          </button>
        </form>

        {/* Voucher List (Scrollable) */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="flex items-center justify-between text-xs text-[#5a4138] font-bold px-1">
            <span>Voucher Tersedia ({AVAILABLE_VOUCHERS.length})</span>
            <span>Total Belanja: Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          {AVAILABLE_VOUCHERS.map((voucher) => {
            const isSelected = tempSelected?.id === voucher.id;
            const isEligible = subtotal >= voucher.minSpend;
            const discountPreview = calculateDiscountPreview(voucher);

            return (
              <div
                key={voucher.id}
                onClick={() => {
                  if (isEligible) {
                    setTempSelected(isSelected ? null : voucher);
                  } else {
                    showToast(
                      'Belanja Belum Mencukupi',
                      `Tambahkan menu lagi senilai Rp ${(voucher.minSpend - subtotal).toLocaleString('id-ID')} untuk mengaktifkan voucher ini.`,
                      true
                    );
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col gap-2 ${
                  isSelected
                    ? 'bg-[#ffdbce]/40 border-[#a33900] shadow-sm'
                    : isEligible
                    ? 'bg-white border-[#dee8ff] hover:border-[#a33900]/50 hover:bg-[#f9f9ff]'
                    : 'bg-[#f0f3ff]/60 border-[#dee8ff] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#a33900] text-white tracking-wider">
                      {voucher.code}
                    </span>
                    <span className="text-[11px] font-bold text-[#006c49] bg-[#6ffbbe]/40 px-2 py-0.5 rounded-full">
                      {voucher.tag}
                    </span>
                  </div>

                  {/* Radio Selector */}
                  <div className="shrink-0 mt-0.5">
                    <span
                      className={`material-symbols-outlined text-xl ${
                        isSelected ? 'text-[#a33900]' : 'text-[#cfdaf2]'
                      }`}
                    >
                      {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#111c2d] leading-snug">
                    {voucher.title}
                  </h4>
                  <p className="text-xs text-[#5a4138] mt-0.5 leading-relaxed">
                    {voucher.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#dee8ff]/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#5a4138]">
                      Min. Belanja: <strong>Rp {voucher.minSpend.toLocaleString('id-ID')}</strong>
                    </span>
                    <span className="text-[#dee8ff]">•</span>
                    <span className="text-[#5a4138]">{voucher.expiryDate}</span>
                  </div>

                  {isEligible ? (
                    <span className="font-bold text-[#a33900]">
                      Hemat Rp {discountPreview.toLocaleString('id-ID')}
                    </span>
                  ) : (
                    <span className="font-semibold text-[#ba1a1a]">
                      Kurang Rp {(voucher.minSpend - subtotal).toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Controls */}
        <div className="mt-4 pt-4 border-t border-[#dee8ff] flex items-center justify-between gap-3">
          {tempSelected ? (
            <button
              type="button"
              onClick={handleRemoveVoucher}
              className="text-xs font-bold text-[#ba1a1a] hover:underline px-2 py-2"
            >
              Hapus Voucher
            </button>
          ) : (
            <span className="text-xs text-[#5a4138]">Belum ada voucher dipilih</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff] transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmSelection}
              className="px-5 py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold transition-all shadow-sm"
            >
              Gunakan Voucher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ModalVoucher = VoucherModal;
