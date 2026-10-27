import React, { useState } from 'react';
import { UserRole, PembeliTab, PenjualTab, UserProfile } from '../types';
import { LOGO_URL, SITI_AVATAR_URL } from '../data/dataMock';

export interface HeaderProps {
  userRole: 'Pembeli' | 'Penjual';
  activePembeliTab: PembeliTab;
  setActivePembeliTab: (tab: PembeliTab) => void;
  activePenjualTab: PenjualTab;
  setActivePenjualTab: (tab: PenjualTab) => void;
  cartItemCount: number;
  hasActiveOrder: boolean;
  onLogout: () => void;
  onOpenPortalModal?: () => void;
  userProfile?: UserProfile | null;
  onOpenProfileModal?: () => void;
  onOpenPreferenceModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  activePembeliTab,
  setActivePembeliTab,
  activePenjualTab,
  setActivePenjualTab,
  cartItemCount,
  hasActiveOrder,
  onLogout,
  onOpenPortalModal,
  userProfile,
  onOpenProfileModal,
  onOpenPreferenceModal
}) => {
  const [tampilkanNotifikasi, setTampilkanNotifikasi] = useState(false);
  const [tampilkanMenuProfil, setTampilkanMenuProfil] = useState(false);

  const daftarNotifikasi = userRole === 'Pembeli' ? [
    { id: 1, title: 'Diskon 35% Spesial', time: '10 mnt lalu', desc: 'Gunakan kupon SELERA35PEDAS saat checkout pesanan.' },
    { id: 2, title: 'Status Pesanan', time: 'Baru saja', desc: hasActiveOrder ? 'Kurir sedang mengantar hidangan ke alamat Anda.' : 'Tidak ada pesanan aktif saat ini.' }
  ] : [
    { id: 1, title: 'Pesanan Baru Masuk!', time: '1 mnt lalu', desc: 'Segera konfirmasi pesanan masuk sebelum timer 10 menit berakhir.' },
    { id: 2, title: 'Laporan Penjualan', time: '1 jam lalu', desc: 'Omzet hari ini mencapai target harian resto.' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#f9f9ff]/95 backdrop-blur-xl shadow-xs border-b border-[#dee8ff]">
      {/* ========================================================================= */}
      {/* 1. BARIS ATAS: HANYA BERISI MERK MAKANDULU & PROFIL PENGGUNA */}
      {/* ========================================================================= */}
      <div className="h-16 w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between border-b border-[#dee8ff]/60">
        {/* Merk MakanDulu */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            if (userRole === 'Pembeli') setActivePembeliTab('katalog');
            else setActivePenjualTab('pesanan');
          }}
        >
          <img
            alt="MakanDulu Brand Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            src={LOGO_URL}
          />
          <div className="flex flex-col">
            <span className="text-lg font-black text-[#111c2d] leading-tight tracking-tight">
              MakanDulu
            </span>
            <span className="text-[10px] font-bold text-[#5a4138]/80 uppercase tracking-widest leading-none">
              {userRole === 'Pembeli' ? 'Ecosystem Kuliner' : 'Mitra Merchant'}
            </span>
          </div>
        </div>

        {/* Profil Pengguna & Alat di Kanan */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Tombol Keluar / Ganti Role */}
          <button
            type="button"
            onClick={onLogout}
            title="Keluar / Ganti Peran Pengguna"
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#dee8ff] shadow-2xs active:scale-95"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span className="hidden sm:inline">Keluar / Ganti Role</span>
          </button>

          {/* Notifikasi Bell */}
          <div className="relative">
            <button
              onClick={() => setTampilkanNotifikasi(!tampilkanNotifikasi)}
              className="relative p-2 rounded-xl bg-white border border-[#dee8ff] text-[#5a4138] hover:text-[#111c2d] hover:bg-[#f0f3ff] transition-colors"
              type="button"
              aria-label="Notifikasi"
            >
              <span className="material-symbols-outlined text-xl leading-none">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#cc4900]"></span>
            </button>

            {tampilkanNotifikasi && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#dee8ff] p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-[#e7eeff] px-2">
                  <span className="text-xs font-bold text-[#111c2d]">Notifikasi</span>
                  <span className="text-[10px] text-[#006c49] font-bold cursor-pointer">Tandai Dibaca</span>
                </div>
                <div className="divide-y divide-[#f0f3ff] max-h-60 overflow-y-auto">
                  {daftarNotifikasi.map((item) => (
                    <div key={item.id} className="p-2 hover:bg-[#f9f9ff] rounded-lg transition-colors cursor-pointer">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-[#111c2d]">{item.title}</span>
                        <span className="text-[10px] text-[#5a4138]">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-[#5a4138] mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profil Pengguna */}
          <div className="relative flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#dee8ff] shadow-xs">
            <div
              onClick={() => {
                if (onOpenProfileModal) onOpenProfileModal();
                else setTampilkanMenuProfil(!tampilkanMenuProfil);
              }}
              className="flex items-center gap-2 pl-1 pr-1 cursor-pointer hover:opacity-90 transition-opacity"
              title="Lihat Detail Profil Akun"
            >
              <img
                alt="Profile Avatar"
                className="w-8 h-8 rounded-full object-cover border border-[#dee8ff]"
                src={
                  userRole === 'Pembeli'
                    ? SITI_AVATAR_URL
                    : 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&q=80'
                }
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#111c2d] leading-snug">
                  {userProfile?.name || (userRole === 'Pembeli' ? 'Siti Rahma' : 'Resto Juara')}
                </span>
                <span className="text-[10px] text-[#006c49] font-extrabold leading-none">
                  {userRole === 'Pembeli' ? 'Food Explorer' : userProfile?.storeName || 'Mitra Resto'}
                </span>
              </div>
            </div>

            {/* Tombol Preferensi Rasa (Khusus Pembeli) */}
            {userRole === 'Pembeli' && onOpenPreferenceModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPreferenceModal();
                }}
                className="w-7 h-7 rounded-xl bg-[#ffdbce] hover:bg-[#a33900] text-[#a33900] hover:text-white transition-all flex items-center justify-center shrink-0 shadow-2xs active:scale-95"
                title="Ubah Preferensi Selera Makanan"
                aria-label="Ubah Preferensi Makanan"
              >
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            )}

            {/* Menu Dropdown Arrow */}
            <button
              type="button"
              onClick={() => setTampilkanMenuProfil(!tampilkanMenuProfil)}
              className="p-1 rounded-lg hover:bg-[#f0f3ff] text-[#5a4138]"
              title="Opsi Profil"
            >
              <span className="material-symbols-outlined text-base">expand_more</span>
            </button>

            {tampilkanMenuProfil && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#dee8ff] p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#e7eeff] bg-[#f9f9ff] rounded-xl mb-1">
                  <p className="text-xs font-bold text-[#111c2d]">
                    {userRole === 'Pembeli'
                      ? userProfile?.name || 'Siti Rahmawati'
                      : userProfile?.storeName || 'Resto Bebek Juara'}
                  </p>
                  <p className="text-[11px] text-[#5a4138] truncate">
                    {userProfile?.email || 'siti.rahma@domain.com'}
                  </p>
                </div>

                <div className="py-1 space-y-0.5">
                  {onOpenProfileModal && (
                    <button
                      onClick={() => {
                        onOpenProfileModal();
                        setTampilkanMenuProfil(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#111c2d] hover:bg-[#f0f3ff] rounded-lg transition-colors flex items-center justify-between font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-[#a33900]">badge</span>
                        <span>Detail Profil Akun</span>
                      </div>
                      <span className="material-symbols-outlined text-xs text-[#5a4138]">chevron_right</span>
                    </button>
                  )}

                  {userRole === 'Pembeli' && onOpenPreferenceModal && (
                    <button
                      onClick={() => {
                        onOpenPreferenceModal();
                        setTampilkanMenuProfil(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#a33900] hover:bg-[#ffdbce]/40 rounded-lg transition-colors flex items-center justify-between font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">tune</span>
                        <span>Ubah Preferensi Rasa</span>
                      </div>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}

                  {onOpenPortalModal && (
                    <button
                      onClick={() => {
                        onOpenPortalModal();
                        setTampilkanMenuProfil(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#111c2d] hover:bg-[#f0f3ff] rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm text-[#5a4138]">switch_account</span>
                      <span>Portal Registrasi & Login</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onLogout();
                      setTampilkanMenuProfil(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors flex items-center gap-2 font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Keluar & Ganti Peran</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARIS KEDUA: BAR MENU (KATALOG MENU, CHECKOUT, PENGIRIMAN) */}
      {/* ========================================================================= */}
      <div className="h-12 w-full px-4 sm:px-6 lg:px-10 bg-[#f0f3ff] border-t border-[#dee8ff]/80 flex items-center justify-start overflow-x-auto gap-2">
        {userRole === 'Pembeli' ? (
          /* Menu Bar Pembeli: Katalog Menu, Checkout, Pengiriman */
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePembeliTab('katalog')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activePembeliTab === 'katalog'
                  ? 'bg-[#cc4900] text-white shadow-xs'
                  : 'text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="material-symbols-outlined text-base">restaurant_menu</span>
              <span>Katalog Menu</span>
            </button>

            <button
              onClick={() => setActivePembeliTab('keranjang')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activePembeliTab === 'keranjang'
                  ? 'bg-[#cc4900] text-white shadow-xs'
                  : 'text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="material-symbols-outlined text-base">shopping_cart_checkout</span>
              <span>Checkout</span>
              {cartItemCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activePembeliTab === 'keranjang' ? 'bg-white text-[#cc4900]' : 'bg-[#cc4900] text-white'
                  }`}
                >
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActivePembeliTab('tracking')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activePembeliTab === 'tracking'
                  ? 'bg-[#cc4900] text-white shadow-xs'
                  : 'text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="material-symbols-outlined text-base">moped</span>
              <span>Pengiriman</span>
              {hasActiveOrder ? (
                <span className="flex items-center gap-1 bg-[#6ffbbe] text-[#004d33] px-2 py-0.2 rounded-full text-[10px] font-extrabold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006c49]"></span>
                  <span>Sedang Diantar</span>
                </span>
              ) : (
                <span className="text-[10px] text-[#5a4138] bg-[#dee8ff] px-2 py-0.2 rounded-full font-semibold">
                  Selesai
                </span>
              )}
            </button>
          </div>
        ) : (
          /* Menu Bar Penjual: Menu Pesanan, Kelola Stok, Dashboard */
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePenjualTab('pesanan')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activePenjualTab === 'pesanan'
                  ? 'bg-[#825100] text-white shadow-xs'
                  : 'text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span>Menu Pesanan (10 Mnt)</span>
            </button>

            <button
              onClick={() => setActivePenjualTab('stok')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activePenjualTab === 'stok'
                  ? 'bg-[#825100] text-white shadow-xs'
                  : 'text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="material-symbols-outlined text-base">inventory_2</span>
              <span>Kelola Stok</span>
            </button>

            <button
              onClick={() => setActivePenjualTab('dashboard')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activePenjualTab === 'dashboard'
                  ? 'bg-[#825100] text-white shadow-xs'
                  : 'text-[#5a4138] hover:text-[#111c2d] hover:bg-[#dee8ff]'
              }`}
            >
              <span className="material-symbols-outlined text-base">monitoring</span>
              <span>Dashboard Merchant</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export const NavigasiAtas = Header;
export default Header;
