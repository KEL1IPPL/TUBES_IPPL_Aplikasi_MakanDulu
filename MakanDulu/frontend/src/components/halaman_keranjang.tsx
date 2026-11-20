import React from 'react';
import { CartItem } from '../types';

interface HalamanKeranjangProps {
  cart: CartItem[];
  onUpdateQty: (menuId: string, delta: number) => void;
  onRemoveItem: (menuId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onBackToCatalog: () => void;
}

const HalamanKeranjang: React.FC<HalamanKeranjangProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onBackToCatalog
}) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  if (cart.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#dee8ff] shadow-sm">
        <div className="w-20 h-20 rounded-3xl bg-[#f0f3ff] text-[#5a4138] flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-4xl">shopping_cart</span>
        </div>
        <h2 className="text-xl font-black text-[#111c2d] mb-1">Keranjang Belanja Kosong</h2>
        <p className="text-xs text-[#5a4138] max-w-md mx-auto mb-6">
          Anda belum memilih hidangan kuliner lezat apapun. Jelajahi katalog menu sekarang!
        </p>
        <button
          type="button"
          onClick={onBackToCatalog}
          className="px-6 py-3 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">restaurant_menu</span>
          <span>Buka Katalog Makanan</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#f0f3ff] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#111c2d]">Keranjang Belanja</h2>
            <p className="text-xs text-[#5a4138]">
              {totalItemCount} item hidangan dari <strong className="text-[#a33900]">{cart[0]?.restaurant}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearCart}
          className="text-xs text-[#ba1a1a] font-bold hover:underline"
        >
          Kosongkan
        </button>
      </div>

      {/* Item List */}
      <div className="divide-y divide-[#f0f3ff]">
        {cart.map((item) => (
          <div key={item.id} className="py-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#111c2d]">{item.name}</h3>
              {item.sublabel && (
                <p className="text-[11px] text-[#5a4138] italic">Catatan: {item.sublabel}</p>
              )}
              <span className="text-xs font-black text-[#a33900] block mt-1">
                Rp {item.price.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-[#f0f3ff] p-1 rounded-xl border border-[#dee8ff]">
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.menuId, -1)}
                  className="w-7 h-7 rounded-lg bg-white text-[#111c2d] font-black text-xs flex items-center justify-center hover:bg-[#dee8ff]"
                >
                  -
                </button>
                <span className="w-6 text-center text-xs font-bold text-[#111c2d]">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQty(item.menuId, 1)}
                  className="w-7 h-7 rounded-lg bg-white text-[#111c2d] font-black text-xs flex items-center justify-center hover:bg-[#dee8ff]"
                >
                  +
                </button>
              </div>

              <span className="w-24 text-right text-xs font-black text-[#111c2d]">
                Rp {(item.price * item.qty).toLocaleString('id-ID')}
              </span>

              <button
                type="button"
                onClick={() => onRemoveItem(item.menuId)}
                className="p-1.5 text-[#5a4138] hover:text-[#ba1a1a] transition-colors"
                title="Hapus menu"
              >
                <span className="material-symbols-outlined text-base">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Subtotal & Proceed */}
      <div className="mt-6 pt-6 border-t border-[#dee8ff] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-[#5a4138] block">Subtotal Pesanan:</span>
          <span className="text-xl font-black text-[#a33900]">
            Rp {subtotal.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold transition-all"
          >
            + Tambah Menu
          </button>
          <button
            type="button"
            onClick={onProceedToCheckout}
            className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Lanjut ke Checkout</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HalamanKeranjang;
