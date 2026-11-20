import React, { useState } from 'react';
import { Voucher } from '../types';

interface FormulirVoucherProps {
  initialVoucher?: Voucher | null;
  onSave: (voucher: Voucher) => void;
  onCancel: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const FormulirVoucher: React.FC<FormulirVoucherProps> = ({
  initialVoucher,
  onSave,
  onCancel,
  showToast
}) => {
  const isEditing = Boolean(initialVoucher);

  const [code, setCode] = useState(initialVoucher?.code || '');
  const [title, setTitle] = useState(initialVoucher?.title || '');
  const [description, setDescription] = useState(initialVoucher?.description || '');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'shipping'>(
    initialVoucher?.discountType || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState<number>(initialVoucher?.discountValue || 20);
  const [minSpend, setMinSpend] = useState<number>(initialVoucher?.minSpend || 30000);
  const [maxDiscount, setMaxDiscount] = useState<number>(initialVoucher?.maxDiscount || 20000);
  const [expiryDate, setExpiryDate] = useState(initialVoucher?.expiryDate || '30 November 2026');
  const [tag, setTag] = useState(initialVoucher?.tag || 'Promo Spesial');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      showToast('Data Belum Lengkap', 'Kode dan judul voucher wajib diisi.', true);
      return;
    }

    const payload: Voucher = {
      id: initialVoucher?.id || `vouch-${Date.now()}`,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description.trim() || `Diskon sebesar ${discountValue}${discountType === 'percentage' ? '%' : ' Rupiah'} untuk pesanan Anda.`,
      discountType,
      discountValue: Number(discountValue),
      minSpend: Number(minSpend),
      maxDiscount: discountType === 'percentage' ? Number(maxDiscount) : undefined,
      expiryDate,
      tag: tag.trim() || 'Promo Spesial',
      isActive: true
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">confirmation_number</span>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#111c2d]">
              {isEditing ? 'Edit Voucher Promo' : 'Tambah Voucher Baru'}
            </h3>
            <p className="text-[11px] text-[#5a4138]">
              {isEditing ? 'Perbarui data syarat dan ketentuan voucher' : 'Buat kode diskon baru untuk pesanan'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-lg text-[#5a4138] hover:bg-[#f0f3ff]"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Kode Voucher</label>
          <input
            type="text"
            required
            placeholder="misal: DISKON50"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs font-mono font-bold rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Judul Voucher</label>
          <input
            type="text"
            required
            placeholder="misal: Diskon Gajian 25%"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs font-semibold rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Tipe Diskon</label>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as any)}
            className="w-full px-3 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          >
            <option value="percentage">Persentase (%)</option>
            <option value="fixed">Nominal Flat (Rp)</option>
            <option value="shipping">Gratis Ongkir</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">
            {discountType === 'percentage' ? 'Nilai Diskon (%)' : 'Nilai Potongan (Rp)'}
          </label>
          <input
            type="number"
            min={1}
            required
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Minimal Belanja (Rp)</label>
          <input
            type="number"
            min={0}
            required
            value={minSpend}
            onChange={(e) => setMinSpend(Number(e.target.value))}
            className="w-full px-3 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          />
        </div>
      </div>

      {discountType === 'percentage' && (
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Maksimal Potongan Diskon (Rp)</label>
          <input
            type="number"
            min={1000}
            value={maxDiscount}
            onChange={(e) => setMaxDiscount(Number(e.target.value))}
            className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Masa Berlaku / Kadaluarsa</label>
          <input
            type="text"
            placeholder="misal: 30 November 2026"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Tag Label Voucher</label>
          <input
            type="text"
            placeholder="misal: Flash Deal / Diskon Toko"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-[#111c2d] mb-1">Deskripsi Tambahan</label>
        <textarea
          rows={2}
          placeholder="Tuliskan keterangan syarat dan ketentuan penggunaan voucher..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3.5 py-2 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#a33900]"
        />
      </div>

      <div className="pt-3 border-t border-[#f0f3ff] flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-[#dee8ff] text-xs font-bold text-[#5a4138] hover:bg-[#f0f3ff]"
        >
          Batal
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">check</span>
          <span>{isEditing ? 'Simpan Perubahan Voucher' : 'Terbitkan Voucher Baru'}</span>
        </button>
      </div>
    </form>
  );
};

export default FormulirVoucher;
