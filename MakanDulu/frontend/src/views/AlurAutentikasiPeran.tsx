import React, { useState } from 'react';
import { UserProfile } from '../types';
import HalamanLoginPembeli from '../components/halaman_login_pembeli';
import HalamanLoginPenjual from '../components/halaman_login_penjual';
import HalamanRegistrasiPembeli from '../components/halaman_registrasi_pembeli';
import HalamanRegistrasiPenjual from '../components/halaman_registrasi_penjual';
import HalamanResetPassword from '../components/halaman_reset_password';
import HalamanPreferensiMakanan from '../components/halaman_preferensi_makanan';

interface AlurAutentikasiPeranProps {
  userRole: 'Pembeli' | 'Penjual';
  onSuccess: (profile: UserProfile) => void;
  onBackToRoleSelect: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const tema = {
  Pembeli: {
    badge: 'bg-[#ffdbce] text-[#a33900]',
    tab: 'bg-white text-[#111c2d] shadow-sm',
  },
  Penjual: {
    badge: 'bg-[#ffddb8] text-[#825100]',
    tab: 'bg-white text-[#111c2d] shadow-sm',
  },
};

const AlurAutentikasiPeran: React.FC<AlurAutentikasiPeranProps> = ({
  userRole,
  onSuccess,
  onBackToRoleSelect,
  showToast,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset' | 'preferensi'>('login');
  const [tempProfile, setTempProfile] = useState<UserProfile | null>(null);
  const warna = tema[userRole];

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10">
      <div className={`w-full ${mode === 'preferensi' ? 'max-w-3xl' : 'max-w-xl'} bg-white rounded-3xl p-6 sm:p-10 border border-[#dee8ff] shadow-xl transition-all`}>
        <div className="text-center mb-6">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${warna.badge}`}>
            {mode === 'login'
              ? `Login Masuk • ${userRole}`
              : mode === 'reset'
              ? `Reset Kata Sandi • ${userRole}`
              : mode === 'preferensi'
              ? `Preferensi Selera • ${userRole}`
              : `Pendaftaran Akun Baru • ${userRole}`}
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
            {mode === 'login'
              ? `Selamat Datang, ${userRole}!`
              : mode === 'reset'
              ? 'Lupa Kata Sandi Akun?'
              : mode === 'preferensi'
              ? 'Pilih Preferensi Selera Makanan Anda'
              : `Daftar Akun ${userRole} MakanDulu`}
          </h2>

          <p className="text-xs sm:text-sm text-[#5a4138] mt-1 max-w-md mx-auto">
            {mode === 'login'
              ? 'Masukkan email dan password akun Anda untuk melanjutkan.'
              : mode === 'reset'
              ? 'Atur ulang kata sandi akun Anda secara instan dengan verifikasi kode OTP.'
              : mode === 'preferensi'
              ? 'Pilih cita rasa dan kategori hidangan favorit Anda atau lewati untuk langsung masuk ke beranda.'
              : userRole === 'Pembeli'
              ? 'Lengkapi formulir data diri pendaftaran pembeli untuk membuat akun baru.'
              : 'Lengkapi formulir pendaftaran mitra toko kuliner dan unggah dokumen legalitas (NIB, KTP, NPWP).'}
          </p>
        </div>

        {mode !== 'reset' && mode !== 'preferensi' && (
          <div className="flex items-center p-1 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'login' ? warna.tab : 'text-[#5a4138] hover:text-[#111c2d]'
              }`}
            >
              Sudah Punya Akun (Login)
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'register' ? warna.tab : 'text-[#5a4138] hover:text-[#111c2d]'
              }`}
            >
              Belum Punya Akun (Daftar)
            </button>
          </div>
        )}

        {mode === 'login' && userRole === 'Pembeli' && (
          <HalamanLoginPembeli
            embedded
            onSuccess={onSuccess}
            onNavigateToRegister={() => setMode('register')}
            onNavigateToForgotPassword={() => setMode('reset')}
            showToast={showToast}
          />
        )}

        {mode === 'login' && userRole === 'Penjual' && (
          <HalamanLoginPenjual
            embedded
            onSuccess={onSuccess}
            onNavigateToRegister={() => setMode('register')}
            onNavigateToForgotPassword={() => setMode('reset')}
            showToast={showToast}
          />
        )}

        {mode === 'register' && userRole === 'Pembeli' && (
          <HalamanRegistrasiPembeli
            embedded
            onSuccess={(profilBaru) => {
              // Sequence Diagram: Setelah registrasi pembeli, buka halaman preferensi makanan
              setTempProfile(profilBaru);
              setMode('preferensi');
              showToast('Registrasi Berhasil', 'Silakan pilih selera makan Anda atau klik Lewati.');
            }}
            onNavigateToLogin={() => setMode('login')}
            showToast={showToast}
          />
        )}

        {mode === 'register' && userRole === 'Penjual' && (
          <HalamanRegistrasiPenjual
            embedded
            onSuccess={onSuccess}
            onNavigateToLogin={() => setMode('login')}
            showToast={showToast}
          />
        )}

        {mode === 'reset' && (
          <HalamanResetPassword
            embedded
            role={userRole}
            onBackToLogin={() => setMode('login')}
            showToast={showToast}
          />
        )}

        {/* Boundary: halaman_preferensi_makanan setelah registrasi pembeli */}
        {mode === 'preferensi' && (
          <HalamanPreferensiMakanan
            isPostRegistration
            currentPreferences={tempProfile?.preferences}
            onComplete={(updatedPreferences) => {
              const finalProfile: UserProfile = {
                ...(tempProfile || {
                  id: 1,
                  name: 'Pembeli',
                  email: '',
                  phone: '',
                  address: '',
                  role: 'Pembeli',
                }),
                preferences: updatedPreferences || tempProfile?.preferences,
              };
              onSuccess(finalProfile);
            }}
            onSkip={() => {
              if (tempProfile) {
                onSuccess(tempProfile);
              }
            }}
            showToast={showToast}
          />
        )}

        {mode !== 'preferensi' && (
          <button
            type="button"
            onClick={onBackToRoleSelect}
            className="mt-6 mx-auto flex items-center gap-1.5 text-xs text-[#5a4138] hover:text-[#111c2d] font-bold"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali ke Pemilihan Peran
          </button>
        )}
      </div>
    </div>
  );
};

export default AlurAutentikasiPeran;
