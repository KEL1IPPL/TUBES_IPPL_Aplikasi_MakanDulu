import React, { useState } from 'react';
import { UserProfile } from '../types';
import { login } from '../services/apiClient';

interface HalamanLoginPembeliProps {
  onSuccess: (profile: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
  embedded?: boolean;
}

const HalamanLoginPembeli: React.FC<HalamanLoginPembeliProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  showToast,
  embedded = false,
}) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Email Wajib Diisi', 'Masukkan alamat email Anda.', true);
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showToast('Format Email Salah', 'Masukkan alamat email yang valid.', true);
      return;
    }
    if (!password.trim()) {
      showToast('Password Wajib Diisi', 'Masukkan kata sandi Anda.', true);
      return;
    }
    if (password.length < 8) {
      showToast('Password Terlalu Pendek', 'Kata sandi minimal 8 karakter.', true);
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({ email: email.trim(), password, role: 'Pembeli' });
      if (!data.token || !data.user) throw new Error(data.message || 'Respons login tidak lengkap.');
      localStorage.setItem('makandulu_token', data.token);
      const profile: UserProfile = { ...data.user, role: 'Pembeli' };
      showToast('Login Berhasil', `Selamat datang kembali, ${profile.name}.`);
      onSuccess(profile);
    } catch (error) {
      showToast('Login Gagal', error instanceof Error ? error.message : 'Tidak dapat terhubung ke backend.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={embedded ? 'w-full' : 'w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl'}>
      {!embedded && <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0f3ff]">
        <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-2xl">person</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#111c2d]">Masuk Sebagai Pembeli</h2>
          <p className="text-xs text-[#5a4138]">Akses akun belanja kuliner Anda</p>
        </div>
      </div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Alamat Email</label>
          <input
            type="email"
            required
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#111c2d]">Kata Sandi</label>
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="text-xs text-[#a33900] font-bold hover:underline"
            >
              Lupa sandi?
            </button>
          </div>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-11 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d] flex items-center justify-center p-0.5 focus:outline-none"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
              <span className="material-symbols-outlined text-lg leading-none">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">login</span>
          )}
          <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
        </button>

        <p className="text-center text-xs text-[#5a4138] pt-3">
          Belum punya akun?{' '}
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-[#a33900] font-bold hover:underline"
          >
            Daftar Di Sini
          </button>
        </p>
      </form>
    </div>
  );
};

export default HalamanLoginPembeli;
