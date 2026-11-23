/**
 * Boundary Object: Halaman Hasil Pencarian
 *
 * Mengimplementasikan alur dari Diagram Robustness:
 * - Alternative Flow #1: Menampilkan hasil query pencarian/filtering katalog dari katalog_controller
 * - Alternative Flow #2: Menampilkan "menu tidak ditemukan" dan menampilkan beberapa menu rekomendasi lainnya berdasarkan preferensi
 */

import React from 'react';
import { MenuItem, UserPreferences } from '../types';
import { SearchKatalogResponse } from '../services/apiClient';

interface HalamanHasilPencarianProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetSearch: () => void;
  isSearching: boolean;
  searchResult: SearchKatalogResponse | null;
  onSelectMenu: (menu: MenuItem) => void;
  onAddToCart?: (menu: MenuItem) => void;
  userPreferences?: UserPreferences;
}

export const HalamanHasilPencarian: React.FC<HalamanHasilPencarianProps> = ({
  searchQuery,
  onSearchChange,
  onResetSearch,
  isSearching,
  searchResult,
  onSelectMenu,
  onAddToCart,
  userPreferences,
}) => {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Search Header Banner */}
      <div className="w-full bg-[#f0f3ff] rounded-3xl p-6 sm:p-8 border border-[#dee8ff]">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={onResetSearch}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#dee8ff] text-[#cc4900] text-xs font-bold border border-[#dee8ff] transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Kembali ke Katalog</span>
            </button>
            <span className="px-3 py-1 rounded-full bg-[#ffdbce] text-[#a33900] text-[11px] font-black uppercase tracking-wider">
              Pencarian Katalog
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#111c2d]">
            Hasil Penelusuran Menu Makanan
          </h1>

          <div className="relative max-w-xl mx-auto pt-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 pt-1 -translate-y-1/2 text-[#5a4138]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari makanan favorit, bebek bumbu hitam, bakso, sambal..."
              className="w-full pl-12 pr-10 py-3 bg-white text-[#111c2d] rounded-2xl text-xs sm:text-sm shadow-md border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onResetSearch}
                className="absolute right-4 top-1/2 pt-1 -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d]"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="w-full bg-white rounded-3xl p-12 text-center border border-[#dee8ff]">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#cc4900] border-t-transparent mb-3" />
          <p className="text-xs text-[#5a4138] font-bold">
            Menghubungi katalog_controller untuk mencari hidangan...
          </p>
        </div>
      )}

      {/* Alternative Flow #1: Hasil Ditemukan */}
      {!isSearching && searchResult && searchResult.ditemukan && (
        <div className="w-full bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#f0f3ff] mb-6 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#006c49] text-2xl">check_circle</span>
                <h2 className="text-base font-extrabold text-[#111c2d]">
                  Ditemukan {searchResult.totalHasil ?? searchResult.data.length} Menu
                </h2>
              </div>
              <p className="text-xs text-[#5a4138]">
                Menampilkan menu makanan yang cocok dengan kata kunci{' '}
                <span className="font-bold text-[#cc4900]">"{searchQuery}"</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onResetSearch}
              className="text-xs font-bold text-[#cc4900] hover:underline"
            >
              Hapus Filter & Tampilkan Semua Menu
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {searchResult.data.map((menu) => (
              <div
                key={menu.id}
                onClick={() => {
                  if (menu.isAvailable) onSelectMenu(menu);
                }}
                className={`group rounded-2xl p-4 border transition-all shadow-2xs flex flex-col justify-between ${
                  menu.isAvailable
                    ? 'bg-[#f9f9ff] hover:bg-white border-[#dee8ff] hover:border-[#cc4900] hover:shadow-md cursor-pointer'
                    : 'bg-[#f4f4f6] border-[#d8d8de] opacity-60 grayscale cursor-not-allowed'
                }`}
              >
                <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-[#dee8ff]">
                  <img
                    src={menu.imageUrl}
                    alt={menu.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  {!menu.isAvailable ? (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center">
                      <span className="px-3 py-1 rounded-xl bg-[#ba1a1a] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                        Stok Habis
                      </span>
                    </div>
                  ) : (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                      ★ {menu.rating}
                    </span>
                  )}
                  {menu.isAvailable && menu.discountPercentage && (
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-[#ba1a1a] text-white text-[10px] font-black shadow-xs">
                      Diskon {menu.discountPercentage}%
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-black text-[#cc4900] uppercase tracking-wider block">
                    🏪 {menu.restaurant}
                  </span>
                  <h3 className="text-sm font-extrabold text-[#111c2d] line-clamp-1 group-hover:text-[#cc4900] transition-colors">
                    {menu.name}
                  </h3>
                  <p className="text-xs text-[#5a4138] line-clamp-2 leading-relaxed">
                    {menu.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#dee8ff]/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-[#cc4900] block">
                      Rp {menu.price.toLocaleString('id-ID')}
                    </span>
                    {menu.originalPrice && menu.originalPrice > menu.price && (
                      <span className="text-[10px] text-[#5a4138] line-through block">
                        Rp {menu.originalPrice.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMenu(menu);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#cc4900] text-xs font-bold transition-all"
                    >
                      Detail
                    </button>
                    {!menu.isAvailable ? (
                      <span className="px-3 py-1.5 rounded-xl bg-[#e0e0e0] text-[#757575] text-xs font-bold cursor-not-allowed">
                        Stok Habis
                      </span>
                    ) : onAddToCart ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(menu);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#cc4900] hover:bg-[#a33900] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                      >
                        + Pesan
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Flow #2: Hasil Tidak Ditemukan -> Rekomendasi Preferensi */}
      {!isSearching && searchResult && !searchResult.ditemukan && (
        <div className="space-y-6">
          {/* Banner Peringatan Menu Tidak Ditemukan */}
          <div className="w-full bg-[#ffdad6] border-2 border-[#ba1a1a]/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#ba1a1a] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-3xl">search_off</span>
            </div>
            <div className="flex-1">
              <span className="px-2.5 py-0.5 rounded-md bg-[#ba1a1a] text-white text-[10px] font-black uppercase tracking-wider inline-block mb-1">
                Menu Tidak Ditemukan
              </span>
              <h2 className="text-base sm:text-lg font-black text-[#410002]">
                Tidak ada menu yang sesuai dengan "{searchQuery}"
              </h2>
              <p className="text-xs text-[#5a4138] mt-1">
                Jangan khawatir! Berdasarkan analisis selera Anda, berikut beberapa menu
                rekomendasi lainnya yang disaring berdasarkan cita rasa pilihan Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={onResetSearch}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#f0f3ff] text-[#410002] border border-[#ba1a1a]/30 text-xs font-bold shadow-xs transition-all shrink-0"
            >
              Kembali ke Semua Menu
            </button>
          </div>

          {/* Rekomendasi Menu Berdasarkan Preferensi */}
          <div className="w-full bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f0f3ff] mb-6">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#cc4900] text-2xl">
                  auto_awesome
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-[#111c2d]">
                    Rekomendasi Lainnya Berdasarkan Preferensi
                  </h3>
                  <p className="text-xs text-[#5a4138]">
                    Cita rasa favorit:{' '}
                    <span className="font-bold text-[#cc4900]">
                      {(
                        searchResult.preferensi?.rasaFavorit ||
                        userPreferences?.tastes || [
                          'pedas',
                          'gurih',
                        ]
                      ).join(', ')}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(searchResult.rekomendasiAlternatif || []).map((menu) => (
                <div
                  key={menu.id}
                  onClick={() => {
                    if (menu.isAvailable) onSelectMenu(menu);
                  }}
                  className={`group rounded-2xl p-4 border transition-all shadow-2xs flex flex-col justify-between ${
                    menu.isAvailable
                      ? 'bg-[#f9f9ff] hover:bg-white border-[#dee8ff] hover:border-[#cc4900] hover:shadow-md cursor-pointer'
                      : 'bg-[#f4f4f6] border-[#d8d8de] opacity-60 grayscale cursor-not-allowed'
                  }`}
                >
                  <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 bg-[#dee8ff]">
                    <img
                      src={menu.imageUrl}
                      alt={menu.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    {!menu.isAvailable ? (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-3 py-1 rounded-xl bg-[#ba1a1a] text-white text-xs font-black uppercase tracking-wider shadow-sm">
                          Stok Habis
                        </span>
                      </div>
                    ) : (
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                        ★ {menu.rating}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-[#cc4900] uppercase tracking-wider block">
                      🏪 {menu.restaurant}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#111c2d] line-clamp-1 group-hover:text-[#cc4900] transition-colors">
                      {menu.name}
                    </h3>
                    <p className="text-xs text-[#5a4138] line-clamp-2 leading-relaxed">
                      {menu.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#dee8ff]/70 flex items-center justify-between">
                    <span className="text-xs font-black text-[#cc4900]">
                      Rp {menu.price.toLocaleString('id-ID')}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMenu(menu);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#cc4900] text-xs font-bold transition-all"
                      >
                        Detail
                      </button>
                      {!menu.isAvailable ? (
                        <span className="px-3 py-1.5 rounded-xl bg-[#e0e0e0] text-[#757575] text-xs font-bold cursor-not-allowed">
                          Stok Habis
                        </span>
                      ) : onAddToCart ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(menu);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#cc4900] hover:bg-[#a33900] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                        >
                          + Pesan
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HalamanHasilPencarian;
