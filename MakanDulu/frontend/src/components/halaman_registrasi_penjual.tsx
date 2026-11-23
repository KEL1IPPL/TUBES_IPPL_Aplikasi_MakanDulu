import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { bacaDokumenLegalitas, registerPenjual } from '../services/apiClient';

interface HalamanRegistrasiPenjualProps {
  onSuccess: (profile: UserProfile) => void;
  onNavigateToLogin: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
  embedded?: boolean;
}

const HalamanRegistrasiPenjual: React.FC<HalamanRegistrasiPenjualProps> = ({
  onSuccess,
  onNavigateToLogin,
  showToast,
  embedded = false,
}) => {
  const [merchOwner, setMerchOwner] = useState('');
  const [merchStoreName, setMerchStoreName] = useState('');
  const [merchEmail, setMerchEmail] = useState('');
  const [merchPassword, setMerchPassword] = useState('');
  const [merchPhone, setMerchPhone] = useState('');
  const [merchStoreAddress, setMerchStoreAddress] = useState('');

  const [nibNumber, setNibNumber] = useState('');
  const [ktpNumber, setKtpNumber] = useState('');
  const [npwpNumber, setNpwpNumber] = useState('');
  const [nibFile, setNibFile] = useState<File | null>(null);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [npwpFile, setNpwpFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!ktpFile || !npwpFile || !nibFile) return;

    let cancelled = false;
    setIsScanning(true);
    bacaDokumenLegalitas(ktpFile, npwpFile, nibFile)
      .then((response) => {
        if (cancelled) return;
        if (response.data?.nik) setKtpNumber(response.data.nik.replace(/\D/g, ''));
        if (response.data?.npwp) setNpwpNumber(response.data.npwp.replace(/\D/g, ''));
        if (response.data?.nib) setNibNumber(response.data.nib.replace(/\D/g, ''));
        showToast('Hasil Pindai Dokumen', response.message || 'NIK, NPWP, dan NIB otomatis terisi.');
      })
      .catch((error) => {
        if (!cancelled) {
          if (error && typeof error === 'object' && 'responseBody' in error) {
            const body = (error as { responseBody?: { hasilParsial?: { nik?: string; npwp?: string; nib?: string } } }).responseBody;
            if (body?.hasilParsial) {
              if (body.hasilParsial.nik) setKtpNumber(body.hasilParsial.nik.replace(/\D/g, ''));
              if (body.hasilParsial.npwp) setNpwpNumber(body.hasilParsial.npwp.replace(/\D/g, ''));
              if (body.hasilParsial.nib) setNibNumber(body.hasilParsial.nib.replace(/\D/g, ''));
            }
          }
          showToast(
            'OCR Dokumen',
            error instanceof Error ? error.message : 'Periksa kembali foto atau isi nomor secara manual.',
            true
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsScanning(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ktpFile, npwpFile, nibFile]);

  const handleMerchRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!merchOwner.trim()) {
      showToast('Nama Pemilik Wajib Diisi', 'Masukkan nama pemilik usaha.', true);
      return;
    }
    if (!merchStoreName.trim()) {
      showToast('Nama Toko Wajib Diisi', 'Masukkan nama toko atau restoran.', true);
      return;
    }
    if (!merchEmail.trim()) {
      showToast('Email Wajib Diisi', 'Masukkan email bisnis restoran.', true);
      return;
    }
    if (!merchEmail.includes('@') || !merchEmail.includes('.')) {
      showToast('Format Email Salah', 'Masukkan alamat email bisnis yang valid.', true);
      return;
    }
    if (!merchPassword.trim()) {
      showToast('Password Wajib Diisi', 'Masukkan password toko.', true);
      return;
    }
    if (merchPassword.length < 8) {
      showToast('Password Terlalu Pendek', 'Password toko minimal 8 karakter.', true);
      return;
    }
    if (!merchPhone.trim()) {
      showToast('Nomor Telepon Wajib Diisi', 'Masukkan nomor telepon toko.', true);
      return;
    }
    if (!merchStoreAddress.trim()) {
      showToast('Alamat Toko Wajib Diisi', 'Masukkan alamat lengkap toko atau dapur.', true);
      return;
    }
    if (!nibFile || !ktpFile || !npwpFile) {
      showToast('Dokumen Belum Lengkap', 'Unggah NIB, KTP pemilik, dan NPWP.', true);
      return;
    }
    if (!/^\d{16}$/.test(ktpNumber)) {
      showToast('NIK Tidak Valid', 'NIK KTP harus terdiri dari 16 digit.', true);
      return;
    }
    if (!/^(?:\d{15}|\d{21})$/.test(npwpNumber)) {
      showToast('NPWP Tidak Valid', 'Nomor NPWP harus 15 atau 21 digit.', true);
      return;
    }
    if (!/^\d{13}$/.test(nibNumber)) {
      showToast('NIB Tidak Valid', 'Nomor NIB harus terdiri dari 13 digit.', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await registerPenjual(
        {
          ownerName: merchOwner.trim(),
          storeName: merchStoreName.trim(),
          email: merchEmail.trim(),
          password: merchPassword,
          phone: merchPhone.trim(),
          storeAddress: merchStoreAddress.trim(),
          nib: nibNumber,
          ktp: ktpNumber,
          npwp: npwpNumber,
        },
        { nib: nibFile, ktp: ktpFile, npwp: npwpFile }
      );
      if (!response.token || !response.user) {
        throw new Error(response.message || 'Respons registrasi tidak lengkap.');
      }
      localStorage.setItem('makandulu_token', response.token);
      showToast('Kemitraan Diterima!', `Selamat bergabung, ${merchStoreName}.`);
      onSuccess({ ...response.user, role: 'Penjual' });
    } catch (error) {
      showToast(
        'Registrasi Gagal',
        error instanceof Error ? error.message : 'Tidak dapat terhubung ke backend.',
        true
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectNib = () => document.getElementById('register-nib-file')?.click();
  const selectKtp = () => document.getElementById('register-ktp-file')?.click();
  const selectNpwp = () => document.getElementById('register-npwp-file')?.click();

  return (
    <div className={embedded ? 'w-full' : 'w-full max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl'}>
      <form onSubmit={handleMerchRegisterSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1">Nama Pemilik Usaha *</label>
            <input
              type="text"
              required
              value={merchOwner}
              onChange={(event) => setMerchOwner(event.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1">Nama Toko / Restoran *</label>
            <input
              type="text"
              required
              value={merchStoreName}
              onChange={(event) => setMerchStoreName(event.target.value)}
              placeholder="Contoh: Resto Bebek Juara"
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Email Bisnis Restoran *</label>
            <input
              type="email"
              required
              value={merchEmail}
              onChange={(event) => setMerchEmail(event.target.value)}
              placeholder="resto.juara@makan.id"
              className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Password Toko *</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={merchPassword}
                onChange={(event) => setMerchPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-2.5 pr-11 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d] flex items-center justify-center p-0.5 focus:outline-none"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                <span className="material-symbols-outlined text-lg leading-none">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Nomor Telepon Toko / WhatsApp *</label>
          <input
            type="tel"
            required
            value={merchPhone}
            onChange={(event) => setMerchPhone(event.target.value)}
            placeholder="082199887766"
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#111c2d] mb-1">Alamat Lengkap Toko / Dapur Outlet *</label>
          <textarea
            rows={2}
            required
            value={merchStoreAddress}
            onChange={(event) => setMerchStoreAddress(event.target.value)}
            placeholder="Jl. Raya Kebayoran Baru No. 12, Jakarta Selatan..."
            className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none resize-none"
          />
        </div>

        <div className="pt-2">
          <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
            Unggah Berkas Legalitas Wajib (NIB, KTP Pemilik, NPWP) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input id="register-nib-file" type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={(event) => setNibFile(event.target.files?.[0] || null)} />
            <input id="register-ktp-file" type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={(event) => setKtpFile(event.target.files?.[0] || null)} />
            <input id="register-npwp-file" type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={(event) => setNpwpFile(event.target.files?.[0] || null)} />

            <button type="button" onClick={selectNib}
              className="p-3.5 rounded-2xl border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f0f3ff] text-center transition-all flex flex-col items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[#825100] text-xl">{nibFile ? 'check_circle' : 'description'}</span>
              <span className="text-xs font-bold text-[#111c2d]">1. NIB Usaha *</span>
              <span className="text-[10px] text-[#5a4138]">{nibFile?.name || 'Klik untuk unggah NIB'}</span>
            </button>

            <button type="button" onClick={selectKtp}
              className="p-3.5 rounded-2xl border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f0f3ff] text-center transition-all flex flex-col items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[#825100] text-xl">{ktpFile ? 'check_circle' : 'badge'}</span>
              <span className="text-xs font-bold text-[#111c2d]">2. KTP Pemilik *</span>
              <span className="text-[10px] text-[#5a4138]">{ktpFile?.name || 'Klik untuk unggah KTP'}</span>
            </button>

            <button type="button" onClick={selectNpwp}
              className="p-3.5 rounded-2xl border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f0f3ff] text-center transition-all flex flex-col items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[#825100] text-xl">{npwpFile ? 'check_circle' : 'receipt'}</span>
              <span className="text-xs font-bold text-[#111c2d]">3. NPWP Usaha *</span>
              <span className="text-[10px] text-[#5a4138]">{npwpFile?.name || 'Klik untuk unggah NPWP'}</span>
            </button>
          </div>
        </div>

        {(ktpNumber || npwpNumber || nibNumber || isScanning) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111c2d] mb-1">NIK — 16 digit</label>
              <input value={ktpNumber} onChange={(event) => setKtpNumber(event.target.value.replace(/\D/g, ''))}
                required className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111c2d] mb-1">NPWP</label>
              <input value={npwpNumber} onChange={(event) => setNpwpNumber(event.target.value.replace(/\D/g, ''))}
                required className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111c2d] mb-1">NIB — 13 digit</label>
              <input value={nibNumber} onChange={(event) => setNibNumber(event.target.value.replace(/\D/g, ''))}
                required className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff]" />
            </div>
          </div>
        )}

        {isScanning && (
          <div className="rounded-2xl border border-[#ffddb8] bg-[#fff8f0] px-4 py-3 text-xs font-bold text-[#825100] flex items-center gap-2">
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            Membaca NIK, NPWP, dan NIB dari ketiga foto...
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isScanning}
            className="w-full py-3.5 rounded-2xl bg-[#825100] hover:bg-[#a36700] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                <span>Mendaftarkan Mitra Toko...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">store</span>
                <span>Daftar Sebagai Mitra Penjual</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center pt-2 text-xs text-[#5a4138]">
          Sudah punya akun toko?{' '}
          <button type="button" onClick={onNavigateToLogin} className="font-bold text-[#825100] hover:underline">
            Login di sini
          </button>
        </div>
      </form>
    </div>
  );
};

export default HalamanRegistrasiPenjual;
