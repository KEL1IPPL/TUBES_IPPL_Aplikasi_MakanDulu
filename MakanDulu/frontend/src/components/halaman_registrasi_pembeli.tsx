import React, { useState } from 'react';
import { UserProfile } from '../types';
import { registerPembeli } from '../services/apiClient';

interface HalamanRegistrasiPembeliProps {
  onSuccess: (profile: UserProfile) => void;
  onNavigateToLogin: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanRegistrasiPembeli: React.FC<HalamanRegistrasiPembeliProps> = ({
  onSuccess,
  onNavigateToLogin,
  showToast
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      showToast('Kolom Belum Lengkap', 'Semua kolom wajib diisi.', true);
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showToast('Format Email Salah', 'Masukkan alamat email yang valid.', true);
      return;
    }
    if (password !== confirmPassword) {
      showToast('Sandi Tidak Cocok', 'Konfirmasi kata sandi tidak sama.', true);
      return;
    }

    setIsLoading(true);
    try {
      const data = await registerPembeli({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        address: address.trim() || 'Jl. Sudirman No. 42, Jakarta Selatan',
      });
      if (!data.token || !data.user) throw new Error(data.message || 'Respons registrasi tidak lengkap.');
      localStorage.setItem('makandulu_token', data.token);
      const newProfile: UserProfile = { ...data.user, role: 'Pembeli' };
      showToast('Registrasi Berhasil!', `Selamat datang, ${name}.`);
      onSuccess(newProfile);
    } catch (error) {
      showToast('Registrasi Gagal', error instanceof Error ? error.message : 'Tidak dapat terhubung ke backend.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0f3ff]">
        <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-2xl">person_add</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#111c2d]">Registrasi Pembeli</h2>
          <p className="text-xs text-[#5a4138]">Buat akun baru untuk mulai memesan makanan favorit Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nama Lengkap</label>
          <input
            type="text"
            required
            placeholder="misal: Siti Rahmawati"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Email</label>
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
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nomor WhatsApp / HP</label>
            <input
              type="tel"
              required
              placeholder="0812-xxxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Alamat Pengantaran Utama</label>
          <input
            type="text"
            placeholder="Jl. Sudirman No. 42 (Gedung B Lt. 3), Jakarta Selatan"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Kata Sandi</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Ulangi Kata Sandi</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="show-pass-pembeli"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-[#dee8ff] text-[#cc4900] focus:ring-[#cc4900]"
          />
          <label htmlFor="show-pass-pembeli" className="text-xs text-[#5a4138] cursor-pointer">
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
            <span className="material-symbols-outlined text-base">how_to_reg</span>
          )}
          <span>{isLoading ? 'Mendaftarkan Akun...' : 'Daftar Sebagai Pembeli'}</span>
        </button>

        <p className="text-center text-xs text-[#5a4138] pt-3">
          Sudah memiliki akun?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#a33900] font-bold hover:underline"
          >
            Masuk Di Sini
          </button>
        </p>
      </form>
    </div>
  );
};

export default HalamanRegistrasiPembeli;
