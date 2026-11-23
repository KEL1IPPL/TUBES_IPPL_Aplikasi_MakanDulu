import React, { useState } from 'react';
import { MenuItem } from '../types';

interface HalamanKatalogProps {
  menuList: MenuItem[];
  onSelectMenu: (menu: MenuItem) => void;
  onAddToCart: (menu: MenuItem) => void;
  searchFilter?: string;
  isStoreOpen?: boolean;
}

const HalamanKatalog: React.FC<HalamanKatalogProps> = ({
  menuList,
  onSelectMenu,
  onAddToCart,
  searchFilter = '',
  isStoreOpen = true
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Semua Menu' },
    { id: 'ayam-bebek', label: 'Ayam & Bebek' },
    { id: 'mie-bakso', label: 'Mie & Bakso' },
    { id: 'nasi-bakar', label: 'Nasi Nusantara' },
    { id: 'camilan', label: 'Camilan & Martabak' },
    { id: 'minuman', label: 'Minuman' },
    { id: 'promo', label: 'Diskon Spesial' }
  ];

  const filteredMenus = menuList.filter((item) => {
    // Filter search text
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const match =
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.restaurant.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Filter kategori
    if (selectedCategory === 'promo') {
      return Boolean(item.originalPrice && item.originalPrice > item.price);
    }
    if (selectedCategory !== 'all') {
      return item.category === selectedCategory;
    }
    return true;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                active
                  ? 'bg-[#cc4900] text-white border-[#cc4900] shadow-sm'
                  : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredMenus.map((item) => (
          <div
            key={item.id}
            className={`group rounded-3xl p-4 flex flex-col justify-between transition-all duration-200 border ${
              item.isAvailable
                ? 'bg-white border-[#dee8ff] hover:shadow-xl hover:border-[#cc4900]/40'
                : 'bg-[#f4f4f6] border-[#d8d8de] opacity-60 grayscale'
            }`}
          >
            <div>
              {/* Image & Badges */}
              <div
                className="relative w-full h-44 rounded-2xl overflow-hidden bg-[#f0f3ff] cursor-pointer mb-3"
                onClick={() => onSelectMenu(item)}
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#cc4900] text-white text-[10px] font-black shadow-xs">
                    HEMAT {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                  </span>
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center">
                    <span className="px-3 py-1 rounded-xl bg-[#ba1a1a] text-white text-xs font-extrabold shadow-sm">
                      Stok Habis
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                  <span className="text-amber-400">★</span>
                  <span>{item.rating}</span>
                </div>
              </div>

              {/* Resto & Title */}
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a33900]">
                  {item.restaurant}
                </span>
                <h3
                  onClick={() => onSelectMenu(item)}
                  className="text-sm font-extrabold text-[#111c2d] line-clamp-1 cursor-pointer hover:text-[#cc4900]"
                >
                  {item.name}
                </h3>
                <p className="text-[11px] text-[#5a4138] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Taste Tags */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {(item.tasteCategory || []).map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-[#f0f3ff] text-[#5a4138] text-[9px] font-bold uppercase tracking-wider"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Price & Add to Cart button */}
            <div className="mt-4 pt-3 border-t border-[#f0f3ff] flex items-center justify-between">
              <div>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-[10px] text-[#5a4138] line-through block">
                    Rp {item.originalPrice.toLocaleString('id-ID')}
                  </span>
                )}
                <span className="text-sm font-black text-[#a33900]">
                  Rp {item.price.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                type="button"
                disabled={!item.isAvailable || !isStoreOpen}
                onClick={() => onAddToCart(item)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95 ${
                  item.isAvailable && isStoreOpen
                    ? 'bg-[#a33900] hover:bg-[#cc4900] text-white'
                    : 'bg-[#cfdaf2] text-[#5a4138] cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                <span>+ Pesan</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMenus.length === 0 && (
        <div className="w-full bg-white rounded-3xl p-12 text-center border border-[#dee8ff] shadow-xs">
          <span className="material-symbols-outlined text-4xl text-[#5a4138] mb-2">restaurant</span>
          <h3 className="text-base font-bold text-[#111c2d]">Menu Tidak Ditemukan</h3>
          <p className="text-xs text-[#5a4138] mt-1">Coba gunakan kata kunci pencarian lain atau pilih kategori Semua Menu.</p>
        </div>
      )}
    </div>
  );
};

export default HalamanKatalog;
