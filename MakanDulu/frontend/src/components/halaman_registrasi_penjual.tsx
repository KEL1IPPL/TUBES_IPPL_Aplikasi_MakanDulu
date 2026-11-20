import React, { useState } from 'react';
import { UserProfile } from '../types';
import { registerPenjual } from '../services/apiClient';

interface HalamanRegistrasiPenjualProps {
  onSuccess: (profile: UserProfile) => void;
  onNavigateToLogin: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanRegistrasiPenjual: React.FC<HalamanRegistrasiPenjualProps> = ({
  onSuccess,
  onNavigateToLogin,
  showToast
}) => {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nibNumber, setNibNumber] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nibFile, setNibFile] = useState<File | null>(null);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  const [ktpNumber, setKtpNumber] = useState('');
  const [npwpNumber, setNpwpNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      showToast('Kolom Belum Lengkap', 'Nama resto, penanggung jawab, kontak, dan sandi wajib diisi.', true);
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showToast('Format Email Salah', 'Masukkan email bisnis yang valid.', true);
      return;
    }
    if (password !== confirmPassword) {
      showToast('Sandi Tidak Cocok', 'Konfirmasi kata sandi tidak sama.', true);
      return;
    }
    if (!nibNumber || !ktpNumber || !npwpNumber || !nibFile || !ktpFile || !npwpFile) {
      showToast('Data Legalitas Belum Lengkap', 'Isi NIB, KTP, NPWP dan unggah ketiga berkas.', true);
      return;
    }

    setIsLoading(true);
    try {
      const data = await registerPenjual({
        ownerName: ownerName.trim(),
        storeName: storeName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        storeAddress: storeAddress.trim() || 'Pusat Kuliner Nusantara, Jakarta Selatan',
        nib: nibNumber.trim(),
        ktp: ktpNumber.trim(),
        npwp: npwpNumber.trim(),
      }, { nib: nibFile, ktp: ktpFile, npwp: npwpFile });
      if (!data.token || !data.user) throw new Error(data.message || 'Respons registrasi tidak lengkap.');
      localStorage.setItem('makandulu_token', data.token);
      showToast('Kemitraan Diterima!', `Selamat bergabung, ${storeName}.`);
      onSuccess({ ...data.user, role: 'Penjual' });
    } catch (error) {
      showToast('Registrasi Gagal', error instanceof Error ? error.message : 'Tidak dapat terhubung ke backend.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0f3ff]">
        <div className="w-12 h-12 rounded-2xl bg-[#ffddb8] text-[#825100] flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-2xl">storefront</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#111c2d]">Registrasi Mitra Penjual</h2>
          <p className="text-xs text-[#5a4138]">Daftarkan resto atau kedai kuliner Anda untuk menjangkau ribuan pelanggan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nama Resto / Toko</label>
            <input
              type="text"
              required
              placeholder="misal: Resto Bebek Juara"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nama Pemilik / Penanggung Jawab</label>
            <input
              type="text"
              required
              placeholder="misal: Budi Santoso"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nomor KTP</label>
            <input type="text" required placeholder="16 digit" value={ktpNumber} onChange={(e) => setKtpNumber(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nomor NPWP</label>
            <input type="text" required placeholder="21 digit" value={npwpNumber} onChange={(e) => setNpwpNumber(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Berkas NIB</label>
            <input type="file" accept="image/*" required onChange={(e) => setNibFile(e.target.files?.[0] || null)} className="w-full text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Berkas KTP</label>
            <input type="file" accept="image/*" required onChange={(e) => setKtpFile(e.target.files?.[0] || null)} className="w-full text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Berkas NPWP</label>
            <input type="file" accept="image/*" required onChange={(e) => setNpwpFile(e.target.files?.[0] || null)} className="w-full text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Email Bisnis Resto</label>
            <input
              type="email"
              required
              placeholder="resto@makan.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nomor Telepon Operasional</label>
            <input
              type="tel"
              required
              placeholder="0821-xxxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Nomor Induk Berusaha (NIB) / SKU</label>
            <input
              type="text"
              placeholder="misal: 9120009876543 (Opsional)"
              value={nibNumber}
              onChange={(e) => setNibNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Alamat Dapur / Lokasi Outlet</label>
            <input
              type="text"
              placeholder="Jl. Kuliner No. 10, Jakarta Selatan"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Kata Sandi Merchant</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
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
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#825100]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="show-pass-penjual"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="rounded border-[#dee8ff] text-[#825100] focus:ring-[#825100]"
          />
          <label htmlFor="show-pass-penjual" className="text-xs text-[#5a4138] cursor-pointer">
            Tampilkan kata sandi
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#825100] hover:bg-[#a36700] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">domain_add</span>
          )}
          <span>{isLoading ? 'Mendaftarkan Resto...' : 'Daftarkan Resto Sebagai Penjual'}</span>
        </button>

        <p className="text-center text-xs text-[#5a4138] pt-3">
          Sudah terdaftar sebagai mitra resto?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-[#825100] font-bold hover:underline"
          >
            Masuk Di Sini
          </button>
        </p>
      </form>
    </div>
  );
};

export default HalamanRegistrasiPenjual;
