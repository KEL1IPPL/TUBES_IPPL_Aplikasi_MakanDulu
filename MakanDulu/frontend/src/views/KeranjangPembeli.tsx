import React, { useState } from 'react';
import { CartItem, DeliveryAddress, PaymentMethod, EWalletProvider, BankProvider, Voucher } from '../types';
import { AVAILABLE_VOUCHERS } from '../data/dataMock';
import { ModalVoucher } from '../components/ModalVoucher';

interface KeranjangPembeliProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  currentAddress: DeliveryAddress;
  onOpenAddressModal: () => void;
  onOrderSuccess: (items: CartItem[], total: number, paymentMethod: PaymentMethod, selectedProvider?: string) => void;
  onNavigateToCatalog: () => void;
  onOpenStoreProfile?: (storeName: string) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const KeranjangPembeli: React.FC<KeranjangPembeliProps> = ({
  cart,
  setCart,
  currentAddress,
  onOpenAddressModal,
  onOrderSuccess,
  onNavigateToCatalog,
  onOpenStoreProfile,
  showToast
}) => {
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(AVAILABLE_VOUCHERS[0]);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('ewallet');
  const [selectedEWallet, setSelectedEWallet] = useState<EWalletProvider>('GoPay');
  const [selectedBank, setSelectedBank] = useState<BankProvider>('Bank BCA');
  const [hasValidAddress, setHasValidAddress] = useState(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('Mohon sambal dipisah dan perbanyak daun kemangi.');
  const [alertNotice, setAlertNotice] = useState<{ text: string; type: 'error' | 'warning' } | null>(null);

  const shippingFee = cart.length > 0 ? 10000 : 0;
  const serviceFee = cart.length > 0 ? 2000 : 0;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalItemCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const calculateDiscount = (voucher: Voucher | null, sub: number): number => {
    if (!voucher || sub === 0) return 0;
    if (sub < voucher.minSpend) return 0;
    if (voucher.discountType === 'shipping') {
      return Math.min(voucher.discountValue, shippingFee);
    }
    if (voucher.discountType === 'fixed') {
      return Math.min(voucher.discountValue, sub);
    }
    if (voucher.discountType === 'percentage') {
      const raw = Math.round((sub * voucher.discountValue) / 100);
      return voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
    }
    return 0;
  };

  const discount = calculateDiscount(appliedVoucher, subtotal);
  const totalPayment = cart.length > 0 ? Math.max(0, subtotal + shippingFee + serviceFee - discount) : 0;

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: string) => {
    const item = cart.find((x) => x.id === id);
    setCart((prev) => prev.filter((x) => x.id !== id));
    if (item) {
      showToast('Menu Dihapus', `${item.name} dikeluarkan dari keranjang pesanan.`);
    }
  };

  const handleSubmitCheckout = () => {
    if (cart.length === 0) {
      showToast('Keranjang Kosong', 'Silakan pilih menu dari katalog terlebih dahulu.', true);
      return;
    }

    if (!hasValidAddress) {
      setAlertNotice({
        type: 'error',
        text: '<strong>Alamat Pengantaran Belum Diisi!</strong> Silakan pilih alamat pengantaran yang valid.'
      });
      showToast('Validasi Gagal', 'Alamat pengantaran belum ditentukan.', true);
      return;
    }

    const provider =
      selectedPayment === 'ewallet'
        ? `E-Wallet (${selectedEWallet})`
        : selectedPayment === 'bank_va'
        ? `Transfer Bank (${selectedBank})`
        : 'COD (Bayar Tunai di Tempat)';

    setIsSubmittingOrder(true);
    setTimeout(() => {
      setIsSubmittingOrder(false);
      onOrderSuccess(cart, totalPayment, selectedPayment, provider);
      showToast('Pesanan Berhasil Masuk Dapur!', 'Pesanan Anda langsung diproses oleh resto. Mengarahkan ke Live Tracking Pesanan...');
    }, 1200);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#dee8ff] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ffdbce] text-[#a33900] text-xs font-bold uppercase">
              Halaman Pembeli
            </span>
            <span className="text-xs text-[#006c49] font-bold bg-[#6ffbbe]/40 px-2.5 py-0.5 rounded-full">
              Checkout Terintegrasi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
            Keranjang & Halaman Checkout Pesanan
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4138] mt-1">
            Periksa kembali rincian menu pesanan, alamat tujuan pengantaran, dan tentukan metode pembayaran pilihan Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToCatalog}
          className="px-4 py-2.5 bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-[#dee8ff] self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Tambah Menu Lain dari Katalog</span>
        </button>
      </div>

      {alertNotice && (
        <div
          className={`mt-6 p-4 rounded-2xl text-xs flex items-start gap-3 transition-all ${
            alertNotice.type === 'error'
              ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]'
              : 'bg-[#ffddb8] text-[#825100] border border-[#ffb95f]'
          }`}
        >
          <span className="material-symbols-outlined text-lg mt-0.5 shrink-0">
            {alertNotice.type === 'error' ? 'error' : 'warning'}
          </span>
          <div className="flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: alertNotice.text }} />
          <button type="button" onClick={() => setAlertNotice(null)} className="text-xs hover:opacity-75">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 mt-8 text-center border border-[#dee8ff] shadow-sm flex flex-col items-center justify-center gap-3">
          <div className="w-20 h-20 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#5a4138]">
            <span className="material-symbols-outlined text-4xl">remove_shopping_cart</span>
          </div>
          <h3 className="text-xl font-bold text-[#111c2d]">Keranjang Pesanan Anda Masih Kosong</h3>
          <p className="text-xs sm:text-sm text-[#5a4138] max-w-md leading-relaxed">
            Pilih aneka kuliner lezat seperti Nasi Bebek Sinjay, Ayam Geprek, atau minuman segar di katalog menu untuk mulai melakukan pemesanan.
          </p>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="mt-4 px-6 py-3 bg-[#a33900] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#cc4900] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">restaurant_menu</span>
            <span>Jelajahi Katalog Menu Makanan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8">
          {/* Left Column: Cart Items List & Instructions (Col-7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#dee8ff]">
              <div className="flex items-center justify-between pb-4 border-b border-[#f0f3ff]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#a33900]">shopping_bag</span>
                  <h2 className="text-base font-bold text-[#111c2d]">
                    Menu yang Dipesan ({totalItemCount} Item)
                  </h2>
                </div>
                {onOpenStoreProfile ? (
                  <button
                    type="button"
                    onClick={() => onOpenStoreProfile(cart[0]?.restaurant || 'Resto Bebek Juara')}
                    className="text-xs text-[#006c49] font-bold bg-[#6ffbbe]/40 hover:bg-[#6ffbbe]/70 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                    title="Klik untuk melihat profil toko dan menu lengkap"
                  >
                    <span className="material-symbols-outlined text-xs">storefront</span>
                    <span>{cart[0]?.restaurant || 'Resto Bebek Juara'}</span>
                    <span className="text-[10px]">→ Profil Toko</span>
                  </button>
                ) : (
                  <span className="text-xs text-[#006c49] font-bold bg-[#6ffbbe]/40 px-2.5 py-0.5 rounded-full">
                    {cart[0]?.restaurant || 'Resto Bebek Juara'}
                  </span>
                )}
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#f0f3ff] mt-2">
                {cart.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-[#111c2d] leading-snug">{item.name}</h4>
                      <p className="text-xs text-[#a33900] font-semibold mt-0.5">{item.sublabel}</p>
                      <span className="text-xs font-bold text-[#111c2d] mt-1 block">
                        Rp {item.price.toLocaleString('id-ID')} / porsi
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {/* Stepper */}
                      <div className="flex items-center gap-2 bg-[#f0f3ff] px-2.5 py-1.5 rounded-xl border border-[#dee8ff]">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white text-[#111c2d] flex items-center justify-center font-bold hover:bg-[#dee8ff] transition-colors shadow-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold px-2 text-[#111c2d] min-w-[20px] text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-7 h-7 rounded-lg bg-white text-[#111c2d] flex items-center justify-center font-bold hover:bg-[#dee8ff] transition-colors shadow-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right flex items-center gap-3">
                        <span className="text-sm font-extrabold text-[#111c2d]">
                          Rp {(item.price * item.qty).toLocaleString('id-ID')}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[#5a4138] hover:text-[#ba1a1a] transition-colors p-1"
                          title="Hapus Menu"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Special Cooking Notes */}
              <div className="mt-4 pt-4 border-t border-[#f0f3ff]">
                <label className="block text-xs font-semibold text-[#111c2d] mb-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#a33900]">edit_note</span>
                  <span>Catatan Khusus untuk Dapur Resto</span>
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Contoh: Sambal jangan terlalu pedas, kuah banyak..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                />
              </div>
            </div>

            {/* Voucher Box with Interactive Modal Trigger */}
            <div className="bg-gradient-to-r from-[#ffdbce] to-[#fffbff] p-5 rounded-3xl border border-[#ffb599] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#a33900] text-white flex items-center justify-center shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-xl">confirmation_number</span>
                </div>
                <div>
                  {appliedVoucher ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#a33900] font-mono tracking-wider">
                          {appliedVoucher.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#a33900] text-white text-[10px] font-bold">
                          {appliedVoucher.tag}
                        </span>
                      </div>
                      <p className="text-xs text-[#5a4138] mt-0.5">
                        {appliedVoucher.title} • <strong className="text-[#006c49]">Hemat Rp {discount.toLocaleString('id-ID')}</strong>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-[#111c2d] block">
                        Belum Ada Voucher Dipakai
                      </span>
                      <p className="text-xs text-[#5a4138] mt-0.5">
                        Pilih voucher promo untuk menghemat total belanja Anda.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {appliedVoucher && (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedVoucher(null);
                      showToast('Voucher Dilepas', 'Potongan diskon telah dibatalkan.');
                    }}
                    className="px-3 py-2 text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl transition-colors"
                  >
                    Hapus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">sell</span>
                  <span>{appliedVoucher ? 'Ganti Voucher' : 'Pilih Voucher'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Controls & Payment Gateway (Col-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#dee8ff] space-y-5">
              {/* Destination Address */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5a4138]">
                    Alamat Pengantaran
                  </span>
                  <button
                    type="button"
                    onClick={() => setHasValidAddress(!hasValidAddress)}
                    className="text-xs text-[#a33900] font-bold hover:underline"
                  >
                    {hasValidAddress ? 'Simulasi Kosong' : 'Isi Alamat'}
                  </button>
                </div>

                <div
                  className={`p-3.5 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] flex items-start gap-3 transition-all ${
                    !hasValidAddress ? 'opacity-40' : ''
                  }`}
                >
                  <span className="material-symbols-outlined text-[#a33900] text-xl mt-0.5">
                    location_on
                  </span>
                  <div className="flex-1 text-left">
                    <span className="text-xs font-bold text-[#111c2d] block">
                      {currentAddress.street}
                    </span>
                    <span className="text-[11px] text-[#5a4138] block mt-0.5">
                      {currentAddress.details} • Catatan: {currentAddress.notes}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenAddressModal}
                    className="text-xs text-[#a33900] font-bold hover:underline shrink-0"
                  >
                    Ganti
                  </button>
                </div>

                {!hasValidAddress && (
                  <p className="text-[11px] text-[#ba1a1a] font-bold mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    Alamat belum ditentukan! Harap isi alamat pengiriman.
                  </p>
                )}
              </div>

              {/* Payment Methods */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5a4138]">
                    Metode Pembayaran
                  </span>
                  <span className="text-[10px] text-[#006c49] font-bold">100% Aman Terenkripsi</span>
                </div>

                <div className="space-y-3">
                  {/* Option 1: E-Wallet (GoPay, DANA, OVO) */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      selectedPayment === 'ewallet'
                        ? 'border-[#006c49] bg-[#6ffbbe]/20 ring-1 ring-[#006c49]'
                        : 'border-[#dee8ff] bg-[#f9f9ff] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pay_choice"
                          value="ewallet"
                          checked={selectedPayment === 'ewallet'}
                          onChange={() => setSelectedPayment('ewallet')}
                          className="accent-[#006c49]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#111c2d]">E-Wallet (GoPay, DANA, OVO)</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#f0f3ff] text-[#006c49] text-[10px] font-bold">
                              Non-COD (Lunas)
                            </span>
                          </div>
                          <span className="text-[11px] text-[#5a4138]">
                            Pembayaran digital instan terintegrasi
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#006c49]">wallet</span>
                    </label>

                    {/* Dropdown Pemilihan Spesifik E-Wallet */}
                    {selectedPayment === 'ewallet' && (
                      <div className="mt-3 pt-2.5 border-t border-[#dee8ff]/80">
                        <label className="block text-[11px] font-bold text-[#111c2d] mb-1">
                          Pilih Layanan E-Wallet:
                        </label>
                        <select
                          value={selectedEWallet}
                          onChange={(e) => setSelectedEWallet(e.target.value as EWalletProvider)}
                          className="w-full px-3 py-2 bg-white rounded-xl text-xs font-bold border border-[#dee8ff] text-[#111c2d] outline-none focus:ring-2 focus:ring-[#006c49]"
                        >
                          <option value="GoPay">🟢 GoPay (Saldo GoPay Instan)</option>
                          <option value="DANA">🔵 DANA (Dompet Digital Indonesia)</option>
                          <option value="OVO">🟣 OVO (OVO Cash & Points)</option>
                        </select>
                        <span className="text-[10px] text-[#5a4138] block mt-1">
                          *Terhubung langsung dengan akun {selectedEWallet} Anda.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Transfer Bank (BNI, BCA, Mandiri, Bank Lainnya) */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      selectedPayment === 'bank_va'
                        ? 'border-[#a33900] bg-[#ffdbce]/30 ring-1 ring-[#a33900]'
                        : 'border-[#dee8ff] bg-[#f9f9ff] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pay_choice"
                          value="bank_va"
                          checked={selectedPayment === 'bank_va'}
                          onChange={() => setSelectedPayment('bank_va')}
                          className="accent-[#a33900]"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#111c2d] block">Transfer Virtual Account</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#f0f3ff] text-[#5a4138] text-[10px] font-bold">
                              Non-COD (Lunas)
                            </span>
                          </div>
                          <span className="text-[11px] text-[#5a4138]">
                            BCA, BNI, Mandiri & Bank Lainnya
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#5a4138]">account_balance</span>
                    </label>

                    {/* Dropdown Pemilihan Spesifik Bank */}
                    {selectedPayment === 'bank_va' && (
                      <div className="mt-3 pt-2.5 border-t border-[#dee8ff]/80">
                        <label className="block text-[11px] font-bold text-[#111c2d] mb-1">
                          Pilih Bank Pembayaran:
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value as BankProvider)}
                          className="w-full px-3 py-2 bg-white rounded-xl text-xs font-bold border border-[#dee8ff] text-[#111c2d] outline-none focus:ring-2 focus:ring-[#a33900]"
                        >
                          <option value="Bank BCA">🏦 Bank Central Asia (BCA Virtual Account)</option>
                          <option value="Bank BNI">🏦 Bank Negara Indonesia (BNI Virtual Account)</option>
                          <option value="Bank Mandiri">🏦 Bank Mandiri (Mandiri Livin' / Bill Payment)</option>
                          <option value="Bank Lainnya">🏦 Bank Lainnya (BRI / Permata / CIMB Niaga)</option>
                        </select>
                        <span className="text-[10px] text-[#5a4138] block mt-1">
                          *Nomor VA {selectedBank} akan dibuat otomatis untuk pembayaran pesanan.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Option 3: COD */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      selectedPayment === 'cod'
                        ? 'border-[#825100] bg-[#ffddb8]/30 ring-1 ring-[#825100]'
                        : 'border-[#dee8ff] bg-[#f9f9ff] hover:bg-[#f0f3ff]'
                    }`}
                  >
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="pay_choice"
                          value="cod"
                          checked={selectedPayment === 'cod'}
                          onChange={() => setSelectedPayment('cod')}
                          className="accent-[#825100]"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#111c2d] block">COD (Bayar di Tempat)</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold">
                              Bisa Ditolak
                            </span>
                          </div>
                          <span className="text-[11px] text-[#5a4138]">
                            Bayar tunai ke kurir. Bisa ditolak jika makanan rusak atau salah menu.
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#825100]">payments</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="p-4 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] space-y-2">
                <div className="flex justify-between text-xs text-[#5a4138]">
                  <span>Subtotal Menu ({totalItemCount} porsi)</span>
                  <span className="font-bold text-[#111c2d]">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-[#5a4138]">
                  <span>Ongkos Kirim Standar (1.2 km)</span>
                  <span className="font-bold text-[#111c2d]">Rp {shippingFee.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-xs text-[#5a4138]">
                  <span>Biaya Layanan & Pengemasan</span>
                  <span className="font-bold text-[#111c2d]">Rp {serviceFee.toLocaleString('id-ID')}</span>
                </div>
                {appliedVoucher && discount > 0 && (
                  <div className="flex justify-between text-xs text-[#006c49] font-bold">
                    <span>Voucher Diskon ({appliedVoucher.code})</span>
                    <span>- Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="h-px bg-[#dee8ff] my-1"></div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-sm font-bold text-[#111c2d]">Total Pembayaran</span>
                  <span className="text-2xl font-extrabold text-[#a33900]">
                    Rp {totalPayment.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Order Button */}
              <button
                type="button"
                disabled={isSubmittingOrder || cart.length === 0}
                onClick={handleSubmitCheckout}
                className="w-full py-4 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-base shadow-lg shadow-[#a33900]/25 transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                {isSubmittingOrder ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">shopping_cart_checkout</span>
                    <span>Konfirmasi Pesanan Sekarang (Rp {totalPayment.toLocaleString('id-ID')})</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-[#5a4138] text-center leading-tight">
                Setelah konfirmasi dibuat, sistem otomatis mengarahkan ke tab <strong>Live Tracking Pesanan</strong> untuk melacak armada kurir.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Voucher Selection Modal */}
      <ModalVoucher
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        selectedVoucher={appliedVoucher}
        onApplyVoucher={(vouch) => setAppliedVoucher(vouch)}
        subtotal={subtotal}
        showToast={showToast}
      />
    </div>
  );
};

export const PembeliCartCheckoutView = KeranjangPembeli;
export const TampilanKeranjangPembeli = KeranjangPembeli;
export default KeranjangPembeli;

