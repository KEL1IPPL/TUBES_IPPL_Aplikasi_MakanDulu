import React, { useState } from 'react';
import { UserProfile } from '../types';
import { login } from '../services/apiClient';

interface HalamanLoginPembeliProps {
  onSuccess: (profile: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanLoginPembeli: React.FC<HalamanLoginPembeliProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  showToast
}) => {
  const [email, setEmail] = useState('siti.rahma@domain.com');
  const [password, setPassword] = useState('PasswordAman123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast('Input Kosong', 'Email dan kata sandi wajib diisi.', true);
      return;
    }

    setIsLoading(true);
    try {
      const data = await login({ email: email.trim(), password, role: 'Pembeli' });
      if (!data.token || !data.user) throw new Error(data.message || 'Respons login tidak lengkap.');
      localStorage.setItem('makandulu_token', data.token);
      const profile: UserProfile = { ...data.user, role: 'Pembeli', balance: 150000 };
      showToast('Login Berhasil', `Selamat datang kembali, ${profile.name}.`);
      onSuccess(profile);
    } catch (error) {
      showToast('Login Gagal', error instanceof Error ? error.message : 'Tidak dapat terhubung ke backend.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0f3ff]">
        <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-2xl">person</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#111c2d]">Masuk Sebagai Pembeli</h2>
          <p className="text-xs text-[#5a4138]">Akses akun belanja kuliner Anda</p>
        </div>
      </div>

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
          <input
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="show-pass-login-pembeli"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-[#dee8ff] text-[#cc4900] focus:ring-[#cc4900]"
          />
          <label htmlFor="show-pass-login-pembeli" className="text-xs text-[#5a4138] cursor-pointer">
            Tampilkan kata sandi
          </label>
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
