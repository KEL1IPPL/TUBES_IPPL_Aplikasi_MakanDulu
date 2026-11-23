import React, { useState, useEffect } from 'react';
import {
  requestPasswordReset,
  verifyPasswordResetOtp,
  saveNewPassword,
} from '../services/apiClient';

interface HalamanResetPasswordProps {
  role: 'Pembeli' | 'Penjual';
  onBackToLogin: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
  embedded?: boolean;
}

const HalamanResetPassword: React.FC<HalamanResetPasswordProps> = ({
  role,
  onBackToLogin,
  showToast,
  embedded = false,
}) => {
  const [step, setStep] = useState<'request' | 'otp' | 'new_password' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Email Wajib Diisi', 'Masukkan alamat email terdaftar.', true);
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      showToast('Format Email Salah', 'Masukkan alamat email yang valid.', true);
      return;
    }
    setIsLoading(true);
    try {
      await requestPasswordReset({ email: email.trim(), role });
      setStep('otp');
      setTimer(60);
      showToast('Kode OTP Terkirim', `Kode verifikasi telah dikirimkan ke ${email}.`);
    } catch (error) {
      showToast('Gagal Mengirim OTP', error instanceof Error ? error.message : 'Permintaan reset gagal.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      showToast('Kode OTP Belum Lengkap', 'Masukkan 6 digit kode OTP.', true);
      return;
    }
    setIsLoading(true);
    try {
      const data = await verifyPasswordResetOtp({
        email: email.trim(),
        role,
        kodeOtp: otp,
      });
      if (!data.resetToken) throw new Error('Token reset password tidak diterima.');
      setResetToken(data.resetToken);
      setStep('new_password');
      showToast('Verifikasi Berhasil', 'Silakan tentukan kata sandi baru Anda.');
    } catch (error) {
      showToast('OTP Tidak Valid', error instanceof Error ? error.message : 'Verifikasi OTP gagal.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      showToast('Password Wajib Diisi', 'Masukkan kata sandi baru.', true);
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password Terlalu Pendek', 'Kata sandi baru minimal 8 karakter.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Sandi Tidak Cocok', 'Konfirmasi kata sandi tidak sama.', true);
      return;
    }
    setIsLoading(true);
    try {
      await saveNewPassword({
        email: email.trim(),
        role,
        resetToken,
        newPassword,
      });
      setStep('done');
      showToast('Sandi Diperbarui', 'Kata sandi berhasil diubah! Silakan masuk kembali.');
    } catch (error) {
      showToast('Gagal Memperbarui Sandi', error instanceof Error ? error.message : 'Reset password gagal.', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={embedded ? 'w-full' : 'w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-[#dee8ff] shadow-xl'}>
      {!embedded && <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0f3ff]">
        <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center font-bold">
          <span className="material-symbols-outlined text-2xl">lock_reset</span>
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#111c2d]">Pemulihan Kata Sandi</h2>
          <p className="text-xs text-[#5a4138]">Reset sandi akun melalui verifikasi kode OTP</p>
        </div>
      </div>}

      {step === 'request' && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <p className="text-xs text-[#5a4138] leading-relaxed">
            Masukkan alamat email yang terdaftar. Kami akan mengirimkan 6-digit kode OTP untuk memverifikasi kepemilikan akun Anda.
          </p>

          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Alamat Email Terdaftar</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">{isLoading ? 'progress_activity' : 'send'}</span>
            <span>{isLoading ? 'Mengirim...' : 'Kirim Kode OTP'}</span>
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#f0f3ff] border border-[#dee8ff] text-xs text-[#5a4138]">
            Kode verifikasi telah dikirim ke: <strong className="text-[#111c2d]">{email}</strong>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Masukkan Kode OTP</label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="misal: 849201"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-[#f9f9ff] text-center tracking-widest font-mono text-lg font-bold rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#5a4138]">
            <span>Kirim ulang kode dalam:</span>
            <span className="font-bold text-[#ba1a1a]">{timer > 0 ? `${timer} detik` : 'Bisa kirim ulang'}</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">{isLoading ? 'progress_activity' : 'verified'}</span>
            <span>{isLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}</span>
          </button>
        </form>
      )}

      {step === 'new_password' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Kata Sandi Baru</label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-11 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
            <button type="button" onClick={() => setShowNewPassword((value) => !value)}
              className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d] flex items-center justify-center p-0.5 focus:outline-none"
              aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
              <span className="material-symbols-outlined text-lg leading-none">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-[#111c2d] mb-1.5">Konfirmasi Kata Sandi Baru</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 pr-11 bg-[#f9f9ff] text-xs sm:text-sm rounded-xl border border-[#dee8ff] focus:outline-none focus:ring-2 focus:ring-[#cc4900]"
            />
            <button type="button" onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-3 top-[calc(50%+8px)] -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d] flex items-center justify-center p-0.5 focus:outline-none"
              aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
              <span className="material-symbols-outlined text-lg leading-none">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">{isLoading ? 'progress_activity' : 'check_circle'}</span>
            <span>{isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</span>
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#6ffbbe]/30 text-[#006c49] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <h3 className="text-base font-extrabold text-[#111c2d]">Kata Sandi Berhasil Diperbarui!</h3>
          <p className="text-xs text-[#5a4138]">
            Anda sekarang dapat masuk ke akun MakanDulu menggunakan kata sandi yang baru dibuat.
          </p>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#a33900] text-white font-bold text-xs sm:text-sm shadow-md hover:bg-[#cc4900] transition-all"
          >
            Masuk Sekarang
          </button>
        </div>
      )}

      {step !== 'done' && (
        <div className="mt-6 pt-4 border-t border-[#f0f3ff] text-center">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-xs text-[#5a4138] hover:text-[#111c2d] font-semibold"
          >
            Batal & Kembali ke Halaman Masuk
          </button>
        </div>
      )}
    </div>
  );
};

export default HalamanResetPassword;
