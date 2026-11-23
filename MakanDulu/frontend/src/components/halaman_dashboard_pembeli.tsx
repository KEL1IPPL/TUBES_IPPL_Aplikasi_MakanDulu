import React from 'react';
import { MenuItem, UserPreferences } from '../types';

interface HalamanDashboardPembeliProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userPreferences?: UserPreferences;
  onOpenPreferenceModal?: () => void;
  recommendedMenus: MenuItem[];
  onSelectMenu: (menu: MenuItem) => void;
  hasActiveOrder?: boolean;
  onNavigateToTracking?: () => void;
}

const HalamanDashboardPembeli: React.FC<HalamanDashboardPembeliProps> = ({
  searchQuery,
  onSearchChange,
  userPreferences,
  onOpenPreferenceModal,
  recommendedMenus,
  onSelectMenu,
  hasActiveOrder,
  onNavigateToTracking
}) => {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* Search Bar Banner */}
      <div className="w-full bg-[#f0f3ff] rounded-3xl p-6 sm:p-8 border border-[#dee8ff]">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="px-3.5 py-1 rounded-full bg-[#ffdbce] text-[#a33900] text-[11px] font-black uppercase tracking-wider">
            Eksplorasi Kuliner Nusantara
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111c2d]">
            Mau Makan Apa Hari Ini?
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4138]">
            Temukan sajian lezat dari mitra resto terdekat yang siap diantar hangat ke lokasi Anda.
          </p>

          <div className="relative max-w-xl mx-auto pt-2">
            <span className="material-symbols-outlined absolute left-4 top-1/2 pt-1 -translate-y-1/2 text-[#5a4138]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari makanan favorit, bebek bumbu hitam, bakso, sambal..."
              className="w-full pl-12 pr-10 py-3.5 bg-white text-[#111c2d] rounded-2xl text-xs sm:text-sm shadow-md border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-4 top-1/2 pt-1 -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d]"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Order Quick Alert Banner */}
      {hasActiveOrder && (
        <div className="w-full bg-[#6ffbbe]/30 border-2 border-[#006c49]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006c49] text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">moped</span>
            </div>
            <div>
              <span className="text-xs font-black text-[#004d33] uppercase tracking-wider block">
                Pesanan Sedang Diantar
              </span>
              <span className="text-xs text-[#111c2d]">
                Kurir sedang menuju alamat pengantaran Anda.
              </span>
            </div>
          </div>
          {onNavigateToTracking && (
            <button
              type="button"
              onClick={onNavigateToTracking}
              className="px-4 py-2 rounded-xl bg-[#006c49] text-white text-xs font-bold shadow-xs hover:bg-[#005236] transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Lacak Posisi Kurir</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          )}
        </div>
      )}

      {/* Rekomendasi Sesuai Preferensi Rasa */}
      <div className="w-full bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f3ff] mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#a33900] text-2xl">auto_awesome</span>
            <div>
              <h2 className="text-base font-extrabold text-[#111c2d]">Rekomendasi Selera Anda</h2>
              <p className="text-[11px] text-[#5a4138]">
                Disaring otomatis berdasarkan cita rasa:{' '}
                <span className="font-bold text-[#a33900]">
                  {(userPreferences?.tastes || ['pedas', 'gurih']).join(', ')}
                </span>
              </p>
            </div>
          </div>

          {onOpenPreferenceModal && (
            <button
              type="button"
              onClick={onOpenPreferenceModal}
              className="px-3 py-1.5 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-xs font-bold text-[#a33900] flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>Ubah Selera</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedMenus.slice(0, 4).map((menu) => (
            <div
              key={menu.id}
              onClick={() => onSelectMenu(menu)}
              className={`group cursor-pointer rounded-2xl p-3 border transition-all shadow-2xs hover:shadow-md flex flex-col justify-between ${
                menu.isAvailable
                  ? 'bg-[#f9f9ff] hover:bg-white border-[#dee8ff] hover:border-[#a33900]'
                  : 'bg-[#f4f4f6] border-[#d8d8de] opacity-60 grayscale'
              }`}
            >
              <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3">
                <img
                  src={menu.imageUrl}
                  alt={menu.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {!menu.isAvailable ? (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#ba1a1a] text-white text-[10px] font-bold">
                    Habis
                  </span>
                ) : (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                    ★ {menu.rating}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#a33900] block">{menu.restaurant}</span>
                <h3 className="text-xs font-extrabold text-[#111c2d] line-clamp-1">{menu.name}</h3>
                <p className="text-[11px] text-[#5a4138] line-clamp-2 mt-0.5">{menu.description}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#dee8ff]/60 flex items-center justify-between">
                <span className="text-xs font-black text-[#a33900]">
                  Rp {menu.price.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-[#006c49] font-bold bg-[#6ffbbe]/30 px-2 py-0.5 rounded-full">
                  Lihat Menu
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HalamanDashboardPembeli;
