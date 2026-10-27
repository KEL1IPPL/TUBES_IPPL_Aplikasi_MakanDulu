import React, { useState } from 'react';
import { MenuItem } from '../types';

interface KelolaStokPenjualProps {
  menuList: MenuItem[];
  onToggleStock: (menuId: string) => void;
  onToggleDiscount?: (menuId: string) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const KelolaStokPenjual: React.FC<KelolaStokPenjualProps> = ({
  menuList,
  onToggleStock,
  onToggleDiscount,
  showToast
}) => {
  const [kataKunciPencarian, setKataKunciPencarian] = useState('');
  const [filterKetersediaan, setFilterKetersediaan] = useState<'all' | 'available' | 'out_of_stock' | 'discounted'>('all');

  const menuTersaring = menuList.filter((item) => {
    const cocokPencarian = item.name.toLowerCase().includes(kataKunciPencarian.toLowerCase()) ||
                          item.description.toLowerCase().includes(kataKunciPencarian.toLowerCase());
    if (!cocokPencarian) return false;
    if (filterKetersediaan === 'available') return item.isAvailable;
    if (filterKetersediaan === 'out_of_stock') return !item.isAvailable;
    if (filterKetersediaan === 'discounted') return Boolean(item.originalPrice && item.originalPrice > item.price);
    return true;
  });

  const jumlahTersedia = menuList.filter((m) => m.isAvailable).length;
  const jumlahHabis = menuList.filter((m) => !m.isAvailable).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#dee8ff] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ffddb8] text-[#825100] text-xs font-bold uppercase">
              Mode Penjual (Merchant)
            </span>
            <span className="text-xs text-[#006c49] font-bold bg-[#6ffbbe]/40 px-2.5 py-0.5 rounded-full">
              Sinkronisasi Katalog Real-time
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
            Kelola Stok Menu Resto Bebek Juara
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4138] mt-1">
            Atur ketersediaan menu makanan & minuman warung Anda. Perubahan status langsung diterapkan ke katalog pembeli secara instan.
          </p>
        </div>

        {/* Stock Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-2xl border border-[#dee8ff] text-center shadow-xs">
            <span className="text-[10px] text-[#006c49] font-bold uppercase block">Stok Tersedia</span>
            <span className="text-lg font-extrabold text-[#006c49]">{jumlahTersedia} Menu</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-2xl border border-[#dee8ff] text-center shadow-xs">
            <span className="text-[10px] text-[#ba1a1a] font-bold uppercase block">Stok Habis</span>
            <span className="text-lg font-extrabold text-[#ba1a1a]">{jumlahHabis} Menu</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-lg">
            search
          </span>
          <input
            type="text"
            value={kataKunciPencarian}
            onChange={(e) => setKataKunciPencarian(e.target.value)}
            placeholder="Cari nama menu olahan..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-xs border border-[#dee8ff] focus:ring-2 focus:ring-[#825100] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: `Semua Menu (${menuList.length})` },
            { id: 'available', label: `Tersedia (${jumlahTersedia})` },
            { id: 'out_of_stock', label: `Habis (${jumlahHabis})` },
            { id: 'discounted', label: `Promo Diskon Penjual 🔥` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterKetersediaan(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                filterKetersediaan === tab.id
                  ? 'bg-[#825100] text-white border-[#825100] shadow-xs'
                  : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuTersaring.map((item) => {
          const hasDiscount = Boolean(item.originalPrice && item.originalPrice > item.price);

          return (
            <div
              key={item.id}
              className={`rounded-3xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                item.isAvailable
                  ? 'bg-white border-[#dee8ff] hover:shadow-md'
                  : 'bg-[#f0f3ff] border-[#dee8ff] opacity-90'
              }`}
            >
              <div>
                <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-gray-100 mb-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      !item.isAvailable ? 'filter grayscale' : ''
                    }`}
                  />
                  <span
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                      item.isAvailable
                        ? 'bg-[#6ffbbe] text-[#002113]'
                        : 'bg-[#ffdad6] text-[#ba1a1a]'
                    }`}
                  >
                    {item.isAvailable ? 'Tersedia' : 'Stok Habis'}
                  </span>

                  {hasDiscount && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-[#ba1a1a] text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">local_fire_department</span>
                      <span>Diskon Penjual {item.discountPercentage || 20}%</span>
                    </span>
                  )}

                  <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                    Terjual: {item.salesCount || '100+'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#5a4138] font-semibold uppercase">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                    ★ {item.rating}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#111c2d] mt-1 leading-snug line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-xs text-[#5a4138] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Price & Seller Discount Info */}
                <div className="flex items-center gap-2 mt-2">
                  {hasDiscount && (
                    <span className="text-xs text-[#5a4138] line-through font-semibold">
                      Rp {item.originalPrice!.toLocaleString('id-ID')}
                    </span>
                  )}
                  <span className="text-base font-extrabold text-[#a33900]">
                    Rp {item.price.toLocaleString('id-ID')}
                  </span>
                  {hasDiscount && (
                    <span className="text-[10px] font-bold text-[#006c49] bg-[#6ffbbe]/40 px-1.5 py-0.5 rounded">
                      Promo Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Toggle Stock & Toggle Discount Promo */}
              <div className="mt-5 pt-4 border-t border-[#dee8ff]/60 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111c2d]">
                    Status Ketersediaan
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onToggleStock(item.id);
                      showToast(
                        'Status Stok Diperbarui',
                        `${item.name} sekarang ${!item.isAvailable ? 'TERSEDIA' : 'HABIS'}.`
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
                      item.isAvailable
                        ? 'bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab]'
                        : 'bg-[#6ffbbe] text-[#002113] hover:bg-[#4edea3]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {item.isAvailable ? 'block' : 'check_circle'}
                    </span>
                    <span>{item.isAvailable ? 'Tandai Habis' : 'Tandai Tersedia'}</span>
                  </button>
                </div>

                {onToggleDiscount && (
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#dee8ff]">
                    <span className="text-xs text-[#5a4138] font-medium">
                      Diskon Promo Penjual
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleDiscount(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs ${
                        hasDiscount
                          ? 'bg-[#f0f3ff] text-[#5a4138] hover:bg-[#dee8ff]'
                          : 'bg-[#ffddb8] text-[#825100] hover:bg-[#ffb95f]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {hasDiscount ? 'percent' : 'local_fire_department'}
                      </span>
                      <span>{hasDiscount ? 'Nonaktifkan Diskon' : 'Beri Diskon 20%'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MerchantStockView = KelolaStokPenjual;
export const TampilanKelolaStokPenjual = KelolaStokPenjual;
export default KelolaStokPenjual;
