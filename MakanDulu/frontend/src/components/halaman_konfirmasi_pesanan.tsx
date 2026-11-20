import React, { useState } from 'react';
import { CartItem, DeliveryAddress, Voucher } from '../types';
import { AVAILABLE_VOUCHERS } from '../data/dataMock';
import FormulirVoucher from './formulir_voucher';

interface HalamanKonfirmasiPesananProps {
  cart: CartItem[];
  currentAddress: DeliveryAddress;
  onOpenAddressModal: () => void;
  selectedVoucher: Voucher | null;
  onSelectVoucher: (v: Voucher | null) => void;
  onProceedToPayment: (finalTotal: number, discountAmount: number) => void;
  onBackToCart: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanKonfirmasiPesanan: React.FC<HalamanKonfirmasiPesananProps> = ({
  cart,
  currentAddress,
  onOpenAddressModal,
  selectedVoucher,
  onSelectVoucher,
  onProceedToPayment,
  onBackToCart,
  showToast
}) => {
  const [voucherList, setVoucherList] = useState<Voucher[]>(AVAILABLE_VOUCHERS);
  const [voucherInputCode, setVoucherInputCode] = useState('');
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = 10000;
  const serviceFee = 2000;

  // Calculate discount
  let discountAmount = 0;
  if (selectedVoucher) {
    if (selectedVoucher.discountType === 'shipping') {
      discountAmount = Math.min(shippingFee, selectedVoucher.discountValue);
    } else if (selectedVoucher.discountType === 'fixed') {
      discountAmount = Math.min(subtotal, selectedVoucher.discountValue);
    } else if (selectedVoucher.discountType === 'percentage') {
      const calc = Math.round((subtotal * selectedVoucher.discountValue) / 100);
      discountAmount = selectedVoucher.maxDiscount ? Math.min(calc, selectedVoucher.maxDiscount) : calc;
    }
  }

  const finalTotal = Math.max(0, subtotal + shippingFee + serviceFee - discountAmount);

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = voucherInputCode.trim().toUpperCase();
    if (!clean) {
      showToast('Kode Kosong', 'Masukkan kode voucher terlebih dahulu.', true);
      return;
    }

    const matched = voucherList.find((v) => v.code.toUpperCase() === clean);
    if (!matched) {
      showToast('Voucher Tidak Valid', `Kode '${clean}' tidak ditemukan.`, true);
      return;
    }

    if (subtotal < matched.minSpend) {
      showToast('Syarat Belum Cukup', `Minimal belanja untuk kode ${matched.code} adalah Rp ${matched.minSpend.toLocaleString('id-ID')}.`, true);
      return;
    }

    onSelectVoucher(matched);
    showToast('Voucher Diterapkan', `Kode ${matched.code} berhasil memotong tagihan.`);
  };

  const handleSaveVoucher = (v: Voucher) => {
    if (editingVoucher) {
      setVoucherList((prev) => prev.map((item) => (item.id === v.id ? v : item)));
      if (selectedVoucher?.id === v.id) onSelectVoucher(v);
      showToast('Voucher Diperbarui', `Voucher ${v.code} berhasil diperbarui.`);
    } else {
      setVoucherList((prev) => [v, ...prev]);
      showToast('Voucher Ditambahkan', `Voucher baru ${v.code} siap digunakan!`);
    }
    setShowVoucherForm(false);
    setEditingVoucher(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCart}
            className="p-2 rounded-xl text-[#5a4138] hover:bg-[#f0f3ff]"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <h1 className="text-xl font-black text-[#111c2d]">Konfirmasi Pesanan</h1>
            <p className="text-xs text-[#5a4138]">Periksa alamat, voucher promo, dan rincian belanja</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-[#ffdbce] text-[#a33900] text-xs font-black">
          Langkah 1 dari 2
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Alamat & Rincian Menu (Col-7) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Alamat Pengantaran */}
          <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#a33900]">location_on</span>
                <span className="text-xs font-bold text-[#111c2d] uppercase tracking-wider">
                  Alamat Pengantaran ({currentAddress.label || 'Rumah'})
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenAddressModal}
                className="text-xs text-[#a33900] font-bold hover:underline"
              >
                Ganti Alamat
              </button>
            </div>
            <div className="text-xs text-[#111c2d] space-y-1">
              <p className="font-bold">{currentAddress.street}</p>
              <p className="text-[#5a4138]">{currentAddress.details}</p>
              {currentAddress.notes && (
                <p className="text-[#5a4138] italic">Catatan Kurir: {currentAddress.notes}</p>
              )}
            </div>
          </div>

          {/* Rincian Menu */}
          <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider pb-2 border-b border-[#f0f3ff]">
              Hidangan dari {cart[0]?.restaurant}
            </h3>
            <div className="divide-y divide-[#f0f3ff]">
              {cart.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#111c2d]">
                      {item.qty}x {item.name}
                    </span>
                    {item.sublabel && (
                      <span className="text-[11px] text-[#5a4138] block italic">{item.sublabel}</span>
                    )}
                  </div>
                  <span className="font-black text-[#111c2d]">
                    Rp {(item.price * item.qty).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Voucher & Total Pembayaran (Col-5) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Voucher Section with Edit & Tambah Voucher */}
          <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f0f3ff]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#111c2d] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[#a33900] text-lg">local_offer</span>
                <span>Voucher & Promo</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingVoucher(null);
                  setShowVoucherForm(true);
                }}
                className="text-[11px] text-[#a33900] font-bold hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span>
                <span>Tambah Voucher</span>
              </button>
            </div>

            {/* Input Promo Code */}
            <form onSubmit={handleApplyCode} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan kode promo..."
                value={voucherInputCode}
                onChange={(e) => setVoucherInputCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 bg-[#f9f9ff] text-xs font-mono font-bold rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#cc4900] text-white text-xs font-bold hover:bg-[#a33900] shadow-xs"
              >
                Gunakan
              </button>
            </form>

            {/* Selected Voucher Banner */}
            {selectedVoucher ? (
              <div className="p-3 rounded-2xl bg-[#6ffbbe]/20 border border-[#006c49]/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-black text-[#006c49] block">
                    {selectedVoucher.code}
                  </span>
                  <span className="text-[11px] text-[#004d33]">{selectedVoucher.title}</span>
                  <span className="text-[10px] text-[#006c49] font-bold block mt-0.5">
                    Hemat Rp {discountAmount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVoucher(selectedVoucher);
                      setShowVoucherForm(true);
                    }}
                    className="p-1 rounded text-[#5a4138] hover:text-[#111c2d]"
                    title="Edit voucher ini"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectVoucher(null)}
                    className="p-1 rounded text-[#ba1a1a] hover:bg-[#ffdad6]"
                    title="Lepas voucher"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <span className="text-[11px] text-[#5a4138] block font-semibold">Pilih dari voucher yang tersedia:</span>
                {voucherList.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      if (subtotal >= v.minSpend) {
                        onSelectVoucher(v);
                        showToast('Voucher Diterapkan', `${v.code} aktif.`);
                      } else {
                        showToast('Syarat Kurang', `Min belanja Rp ${v.minSpend.toLocaleString('id-ID')}`, true);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      subtotal >= v.minSpend
                        ? 'border-[#dee8ff] hover:border-[#a33900] bg-[#f9f9ff]'
                        : 'border-[#dee8ff]/50 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-[#111c2d] block">{v.code}</span>
                      <span className="text-[10px] text-[#5a4138]">{v.title}</span>
                    </div>
                    <span className="text-[10px] text-[#a33900] font-bold">Pilih</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rincian Tagihan & Button */}
          <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#111c2d] uppercase tracking-wider pb-2 border-b border-[#f0f3ff]">
              Rincian Pembayaran
            </h3>
            <div className="space-y-2 text-xs text-[#5a4138]">
              <div className="flex justify-between">
                <span>Subtotal Menu</span>
                <span className="font-bold text-[#111c2d]">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim</span>
                <span className="font-bold text-[#111c2d]">Rp {shippingFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Layanan & Penanganan</span>
                <span className="font-bold text-[#111c2d]">Rp {serviceFee.toLocaleString('id-ID')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#006c49] font-bold">
                  <span>Diskon Voucher ({selectedVoucher?.code})</span>
                  <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#dee8ff] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#5a4138] block">Total Tagihan:</span>
                <span className="text-lg font-black text-[#a33900]">
                  Rp {finalTotal.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onProceedToPayment(finalTotal, discountAmount)}
                className="py-3 px-5 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
              >
                <span>Pilih Pembayaran</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Formulir Voucher Pembeli (Tambah / Edit Voucher) */}
      {showVoucherForm && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#dee8ff]">
            <FormulirVoucher
              initialVoucher={editingVoucher}
              onSave={handleSaveVoucher}
              onCancel={() => {
                setShowVoucherForm(false);
                setEditingVoucher(null);
              }}
              showToast={showToast}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HalamanKonfirmasiPesanan;
