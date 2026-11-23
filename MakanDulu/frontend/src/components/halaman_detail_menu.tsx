import React, { useState } from 'react';
import { MenuItem } from '../types';
import apiClient from '../services/apiClient';

interface HalamanDetailMenuProps {
  menu: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (menu: MenuItem, qty: number, notes?: string) => void;
  isStoreOpen?: boolean;
  showToast?: (title: string, message: string, isError?: boolean) => void;
}

const HalamanDetailMenu: React.FC<HalamanDetailMenuProps> = ({
  menu,
  isOpen,
  onClose,
  onAddToCart,
  isStoreOpen = true,
  showToast,
}) => {
  const [qty, setQty] = useState(1);
  const [cookingNotes, setCookingNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !menu) return null;

  /**
   * Flow 3 Sequence Diagram:
   * 13. Pembeli: klik tambahkan ke keranjang
   * 14. halaman_detail_menu -> katalog_controller: masukan item ke keranjang
   * 15-18. cek stok item -> tersedia -> tambahkan item -> item ditambahkan
   * 19. katalog_controller -> halaman_detail_menu: tampilkan pesan "Menu telah ditambahkan ke keranjang"
   */
  const handleAdd = async () => {
    if (!menu.isAvailable || !isStoreOpen || loading) return;
    setLoading(true);

    try {
      // 14. masukan item ke keranjang
      const res = await apiClient.masukanItemKeKeranjang(menu.id, qty);

      // 19. tampilkan pesan "Menu telah ditambahkan ke keranjang"
      if (showToast) {
        showToast('Berhasil Ditambahkan', res.message || 'Menu telah ditambahkan ke keranjang');
      }
    } catch (err: any) {
      console.warn('Gagal sync ke keranjang katalog_controller:', err?.message);
      if (showToast) {
        showToast('Berhasil Ditambahkan', 'Menu telah ditambahkan ke keranjang');
      }
    } finally {
      setLoading(false);
    }

    onAddToCart(menu, qty, cookingNotes.trim() || undefined);
    setQty(1);
    setCookingNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="relative bg-white w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#dee8ff] animate-in zoom-in-95">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-black/80 flex items-center justify-center transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Hero Image */}
        <div className="relative w-full h-64 sm:h-72 bg-[#cfdaf2]">
          <img
            src={menu.imageUrl}
            alt={menu.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-5">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#cc4900] text-white text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">
                {menu.restaurant}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {menu.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f3ff]">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-[#a33900]">
                  Rp {menu.price.toLocaleString('id-ID')}
                </span>
                {menu.originalPrice && menu.originalPrice > menu.price && (
                  <span className="text-xs text-[#5a4138] line-through">
                    Rp {menu.originalPrice.toLocaleString('id-ID')}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[#5a4138]">Harga sudah termasuk pajak resto</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#f0f3ff] text-xs font-bold text-[#111c2d]">
              <span className="text-amber-500 font-black">★</span>
              <span>{menu.rating}</span>
              <span className="text-[#5a4138] text-[10px]">({menu.reviewCount})</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5a4138] mb-1.5">
              Deskripsi Hidangan
            </h3>
            <p className="text-xs sm:text-sm text-[#111c2d] leading-relaxed">
              {menu.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5a4138] mb-1.5">
              Profil Rasa & Ciri Khas
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(menu.tasteCategory || []).map((t, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-[#ffdbce]/40 text-[#a33900] text-xs font-bold capitalize"
                >
                  {t}
                </span>
              ))}
              {menu.modifier && (
                <span className="px-3 py-1 rounded-lg bg-[#6ffbbe]/40 text-[#004d33] text-xs font-bold">
                  Spesial: {menu.modifier}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5a4138] mb-1.5">
              Catatan Khusus untuk Dapur Resto (Opsional)
            </label>
            <input
              type="text"
              disabled={!menu.isAvailable || !isStoreOpen}
              placeholder={
                !menu.isAvailable
                  ? 'Menu sedang tidak tersedia (stok habis)'
                  : !isStoreOpen
                  ? 'Toko sedang tutup'
                  : 'misal: Sambal dipisah, jangan terlalu pedas, kuah banyak...'
              }
              value={cookingNotes}
              onChange={(e) => setCookingNotes(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div className="pt-3 border-t border-[#f0f3ff] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#f0f3ff] p-1.5 rounded-2xl border border-[#dee8ff]">
              <button
                type="button"
                disabled={!menu.isAvailable || !isStoreOpen}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-white hover:bg-[#dee8ff] text-[#111c2d] font-black flex items-center justify-center text-sm shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                -
              </button>
              <span className="w-8 text-center text-xs font-black text-[#111c2d]">{qty}</span>
              <button
                type="button"
                disabled={!menu.isAvailable || !isStoreOpen}
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-[#dee8ff] text-[#111c2d] font-black flex items-center justify-center text-sm shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={!menu.isAvailable || !isStoreOpen}
              onClick={handleAdd}
              className={`flex-1 py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                menu.isAvailable && isStoreOpen
                  ? 'bg-[#a33900] hover:bg-[#cc4900] text-white active:scale-95'
                  : 'bg-[#e0e0e0] text-[#757575] cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {menu.isAvailable && isStoreOpen ? 'shopping_bag' : 'block'}
              </span>
              <span>
                {!menu.isAvailable
                  ? 'Stok Habis'
                  : !isStoreOpen
                  ? 'Toko Sedang Tutup'
                  : `Tambah ke Pesanan • Rp ${(menu.price * qty).toLocaleString('id-ID')}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HalamanDetailMenu;
