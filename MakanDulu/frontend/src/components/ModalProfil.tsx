import React from 'react';
import { UserProfile, UserRole } from '../types';
import { SITI_AVATAR_URL } from '../data/dataMock';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  userRole: UserRole;
  isStoreOpen?: boolean;
  onOpenPreferenceModal?: () => void;
  onResetData?: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  userRole,
  isStoreOpen = true,
  onOpenPreferenceModal,
  onResetData,
  onLogout
}) => {
  if (!isOpen) return null;

  const isPembeli = userRole === 'Pembeli';

  return (
    <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="relative bg-[#f9f9ff] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#dee8ff]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[#dee8ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a33900] text-xl">badge</span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#5a4138]">
              Profil Akun Terdaftar • Mode {userRole}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#5a4138] hover:text-[#111c2d] border border-[#dee8ff] shadow-xs"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* User Card Header */}
        <div className="my-6 p-5 rounded-3xl bg-white border border-[#dee8ff] shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative">
            <img
              src={
                isPembeli
                  ? SITI_AVATAR_URL
                  : 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=300&q=80'
              }
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                isPembeli ? 'bg-[#006c49] text-white' : isStoreOpen ? 'bg-[#006c49] text-white' : 'bg-[#ba1a1a] text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[10px]">check</span>
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-[#111c2d]">
                  {isPembeli ? userProfile.name : userProfile.storeName || 'Resto Bebek Juara'}
                </h3>
                <p className="text-xs text-[#5a4138]">
                  {isPembeli
                    ? 'Pelanggan Kuliner • Food Explorer'
                    : `Pemilik: ${userProfile.ownerName || userProfile.name}`}
                </p>
              </div>

              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold self-center sm:self-auto ${
                  isPembeli
                    ? 'bg-[#6ffbbe]/40 text-[#004d33]'
                    : isStoreOpen
                    ? 'bg-[#6ffbbe]/40 text-[#004d33]'
                    : 'bg-[#ffdad6] text-[#ba1a1a]'
                }`}
              >
                {isPembeli ? 'Akun Aktif Terverifikasi' : isStoreOpen ? 'Toko Buka (Menerima Order)' : 'Toko Sedang Tutup'}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#5a4138]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#a33900]">mail</span>
                {userProfile.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#006c49]">call</span>
                {userProfile.phone}
              </span>
            </div>
          </div>
        </div>

        {/* Detail Keterangan Waktu Daftar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111c2d] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-[#a33900]">history_edu</span>
              Keterangan Data Waktu Pendaftaran
            </h4>
            <span className="text-[10px] text-[#5a4138]">
              Terdaftar: {userProfile.registeredAt || '20 Oktober 2026'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-2xl border border-[#dee8ff]">
              <span className="text-[10px] text-[#5a4138] uppercase font-bold block mb-1">
                {isPembeli ? 'Nama Lengkap Pendaftar' : 'Nama Pemilik Usaha'}
              </span>
              <span className="font-extrabold text-[#111c2d] block">
                {isPembeli ? userProfile.name : userProfile.ownerName || userProfile.name}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#dee8ff]">
              <span className="text-[10px] text-[#5a4138] uppercase font-bold block mb-1">
                {isPembeli ? 'Email Pendaftaran' : 'Email Bisnis / Resto'}
              </span>
              <span className="font-extrabold text-[#111c2d] block truncate">
                {userProfile.email}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#dee8ff]">
              <span className="text-[10px] text-[#5a4138] uppercase font-bold block mb-1">
                Nomor WhatsApp / Telepon
              </span>
              <span className="font-extrabold text-[#111c2d] block">
                {userProfile.phone}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#dee8ff]">
              <span className="text-[10px] text-[#5a4138] uppercase font-bold block mb-1">
                {isPembeli ? 'Status Keanggotaan' : 'Status Kemitraan Toko'}
              </span>
              <span className="font-extrabold text-[#006c49] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                {isPembeli ? 'Terverifikasi (Member Reguler)' : 'Mitra Resmi Kuliner MakanDulu'}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-[#dee8ff] sm:col-span-2">
              <span className="text-[10px] text-[#5a4138] uppercase font-bold block mb-1">
                {isPembeli ? 'Alamat Pengantaran Terdaftar' : 'Alamat Outlet Resto Fisik'}
              </span>
              <span className="font-semibold text-[#111c2d] block leading-relaxed">
                {userProfile.address}
              </span>
            </div>
          </div>

          {/* Bagian Khusus Penjual: Legalitas NIB, KTP, NPWP */}
          {!isPembeli && (
            <div className="bg-white p-4 rounded-2xl border border-[#dee8ff] space-y-2.5">
              <span className="text-xs font-bold text-[#111c2d] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#006c49]">gavel</span>
                Berkas Legalitas Usaha Terverifikasi
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#f0f3ff] border border-[#dee8ff]">
                  <span className="text-[10px] text-[#5a4138] block font-bold">Nomor NIB (OSS RI)</span>
                  <span className="font-mono font-bold text-[#111c2d]">
                    {userProfile.nibNumber || '9120003849182'}
                  </span>
                  <span className="text-[9px] text-[#006c49] font-bold block mt-0.5">✓ Terverifikasi</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f0f3ff] border border-[#dee8ff]">
                  <span className="text-[10px] text-[#5a4138] block font-bold">KTP Pemilik Usaha</span>
                  <span className="font-mono font-bold text-[#111c2d]">
                    {userProfile.ktpNumber || '3174**********01'}
                  </span>
                  <span className="text-[9px] text-[#006c49] font-bold block mt-0.5">✓ Terverifikasi</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f0f3ff] border border-[#dee8ff]">
                  <span className="text-[10px] text-[#5a4138] block font-bold">NPWP Badan / Toko</span>
                  <span className="font-mono font-bold text-[#111c2d]">
                    {userProfile.npwpNumber || '82.193.***.*-013.000'}
                  </span>
                  <span className="text-[9px] text-[#006c49] font-bold block mt-0.5">✓ Terverifikasi</span>
                </div>
              </div>
            </div>
          )}

          {/* Bagian Khusus Pembeli: Preferensi Selera Makanan & Tombol Ubah Preferensi (dengan tanda panah kanan) */}
          {isPembeli && (
            <div className="bg-[#ffdbce]/20 p-4 rounded-3xl border border-[#ffdbce] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#111c2d] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#a33900]">favorite</span>
                    Preferensi Selera Makanan Anda
                  </h4>
                  <p className="text-[11px] text-[#5a4138]">
                    Menentukan hidangan yang tampil di bagian rekomendasi utama beranda Anda.
                  </p>
                </div>

                {/* Tombol Ubah Preferensi dengan tanda panah kanan */}
                {onOpenPreferenceModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPreferenceModal();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#a33900] text-white hover:bg-[#cc4900] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0 active:scale-95"
                    title="Ubah preferensi kuliner Anda"
                  >
                    <span>Ubah Preferensi</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {userProfile.preferences?.tastes?.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-full bg-[#ffdbce] text-[#7f2b00] text-[11px] font-bold capitalize flex items-center gap-1"
                  >
                    <span>🌶️</span>
                    <span>Rasa: {t.replace('_', ' ')}</span>
                  </span>
                ))}
                {userProfile.preferences?.categories?.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-full bg-[#dee8ff] text-[#111c2d] text-[11px] font-bold capitalize flex items-center gap-1"
                  >
                    <span>🍽️</span>
                    <span>Kategori: {c.replace('_', ' ')}</span>
                  </span>
                ))}
                {userProfile.preferences?.dietary?.map((d) => (
                  <span
                    key={d}
                    className="px-2.5 py-1 rounded-full bg-[#6ffbbe]/40 text-[#004d33] text-[11px] font-bold capitalize flex items-center gap-1"
                  >
                    <span>🥗</span>
                    <span>{d.replace('_', ' ')}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-6 mt-6 border-t border-[#dee8ff] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold border border-[#dee8ff] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Keluar Akun</span>
            </button>

            {onResetData && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mereset seluruh data simulasi ke kondisi awal?')) {
                    onResetData();
                    onClose();
                  }
                }}
                className="px-3 py-2.5 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#5a4138] text-xs font-semibold border border-[#dee8ff] transition-all flex items-center gap-1"
                title="Kembalikan semua data ke setelan bawaan pabrik"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>Reset Data</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#263143] hover:bg-[#111c2d] text-white text-xs font-bold shadow-sm transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export const ModalProfil = ProfileModal;
