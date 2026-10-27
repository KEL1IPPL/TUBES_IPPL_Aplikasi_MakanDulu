import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { LOGO_URL } from '../data/dataMock';

interface RoleAuthFlowProps {
  userRole: 'Pembeli' | 'Penjual';
  onBackToRoleSelect: () => void;
  onAuthSuccess: (userRole: 'Pembeli' | 'Penjual', userProfile?: UserProfile) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const RoleAuthFlow: React.FC<RoleAuthFlowProps> = ({
  userRole,
  onBackToRoleSelect,
  onAuthSuccess,
  showToast
}) => {
  // Mode: 'login' | 'register' | 'preferences' | 'reset-password'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'preferences' | 'reset-password'>('login');

  // Login form state (HANYA EMAIL & PASSWORD)
  const [loginEmail, setLoginEmail] = useState(
    userRole === 'Pembeli' ? 'siti.rahma@domain.com' : 'resto.juara@makan.id'
  );
  const [loginPassword, setLoginPassword] = useState('PasswordAman123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password State
  const [resetEmail, setResetEmail] = useState(
    userRole === 'Pembeli' ? 'siti.rahma@domain.com' : 'resto.juara@makan.id'
  );
  const [resetStep, setResetStep] = useState<'input-email' | 'verify-otp' | 'new-password'>('input-email');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);

  // Pembeli Register Form: (Nama, Email, Password, Nomor Telepon, Alamat)
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Pembeli Food Preferences State (Setelah Daftar)
  const [selectedTastes, setSelectedTastes] = useState<string[]>(['pedas', 'gurih']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['ayam_bebek', 'nasi_bakar']);
  const [selectedDietary, setSelectedDietary] = useState<string[]>(['aman_lambung']);

  // Penjual Register Form: (Nama Pemilik, Nama Toko, Email, Password, Nomor Telepon, Alamat Toko, serta unggah NIB, KTP, NPWP)
  const [merchOwner, setMerchOwner] = useState('');
  const [merchStoreName, setMerchStoreName] = useState('');
  const [merchEmail, setMerchEmail] = useState('');
  const [merchPassword, setMerchPassword] = useState('');
  const [merchPhone, setMerchPhone] = useState('');
  const [merchStoreAddress, setMerchStoreAddress] = useState('');
  const [uploadedNib, setUploadedNib] = useState<string | null>(null);
  const [uploadedKtp, setUploadedKtp] = useState<string | null>(null);
  const [uploadedNpwp, setUploadedNpwp] = useState<string | null>(null);

  // Known registered emails
  const registeredEmails = [
    'siti.rahma@domain.com',
    'resto.juara@makan.id',
    'budi.santoso@makan.id',
    'customer@domain.com'
  ];

  // Feedback alert banner
  const [alertBanner, setAlertBanner] = useState<{
    type: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);

  // Toggle taste preference
  const toggleTaste = (id: string) => {
    setSelectedTastes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle culinary category
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle dietary option
  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle Login (Hanya Email & Password)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAlertBanner({ type: 'error', message: 'Harap masukkan email dan kata sandi akun Anda.' });
      return;
    }

    if (loginPassword === 'salah' || loginPassword === 'wrong') {
      setAlertBanner({ type: 'error', message: 'Email atau kata sandi tidak cocok. Silakan coba kembali.' });
      showToast('Autentikasi Gagal', 'Email atau kata sandi tidak cocok.', true);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showToast('Login Berhasil!', `Selamat datang kembali di MakanDulu (${userRole}).`);

      const defaultProfile: UserProfile = userRole === 'Pembeli' ? {
        name: 'Siti Rahmawati',
        email: loginEmail,
        phone: '0812-3456-7890',
        address: 'Jl. Sudirman No. 42 (Gedung B Lt. 3), Kebayoran Baru, Jakarta Selatan',
        role: 'Pembeli',
        registeredAt: '20 Oktober 2026',
        preferences: {
          tastes: ['pedas', 'gurih'],
          categories: ['ayam_bebek', 'nasi_bakar'],
          dietary: ['aman_lambung']
        }
      } : {
        name: 'Budi Santoso',
        ownerName: 'Budi Santoso',
        storeName: 'Resto Bebek Juara',
        email: loginEmail,
        phone: '0813-8899-7766',
        address: 'Jl. Fatmawati Raya No. 18, Cilandak, Jakarta Selatan',
        role: 'Penjual',
        nibNumber: '9120003849182 (Valid OSS RI)',
        ktpNumber: '3174**********01',
        npwpNumber: '82.193.***.*-013.000',
        registeredAt: '15 Oktober 2026'
      };

      onAuthSuccess(userRole, defaultProfile);
    }, 700);
  };

  // Handle Pembeli Registration -> DIARAHKAN KE PILIH PREFERENSI MAKANAN
  const handleCustRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail || !custPassword || !custPhone || !custAddress) {
      setAlertBanner({ type: 'error', message: 'Semua kolom formulir pendaftaran Pembeli wajib diisi.' });
      return;
    }

    // Check if email already registered -> redirect to login as per user request
    if (registeredEmails.includes(custEmail.toLowerCase().trim())) {
      setAlertBanner({
        type: 'info',
        message: `Email '${custEmail}' sudah terdaftar! Mengalihkan ke halaman login...`
      });
      setLoginEmail(custEmail);
      setTimeout(() => {
        setAuthMode('login');
      }, 1200);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setLoginEmail(custEmail);
      setLoginPassword(custPassword);
      // ALIKAN KE TAHAP PILIH PREFERENSI MAKANAN
      setAuthMode('preferences');
      setAlertBanner(null);
      showToast('Data Diri Tersimpan!', 'Silakan pilih selera preferensi makanan favorit Anda.');
    }, 700);
  };

  // Handle Save Preferences -> LANGSUNG KE HALAMAN UTAMA PEMBELI TANPA LOGIN LAGI
  const handleSavePreferencesSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const buyerProfile: UserProfile = {
        name: custName || 'Siti Rahmawati',
        email: custEmail || 'siti.rahma@domain.com',
        phone: custPhone || '0812-3456-7890',
        address: custAddress || 'Jl. Sudirman No. 42 (Gedung B Lt. 3), Kebayoran Baru, Jakarta Selatan',
        role: 'Pembeli',
        registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        preferences: {
          tastes: selectedTastes,
          categories: selectedCategories,
          dietary: selectedDietary
        }
      };

      showToast(
        'Pendaftaran Berhasil!',
        `Selamat datang di MakanDulu, ${custName || 'Sahabat Kuliner'}! Preferensi Anda langsung aktif.`
      );
      // Langsung menuju ke halaman utama pembeli tanpa perlu login lagi
      onAuthSuccess('Pembeli', buyerProfile);
    }, 700);
  };

  // Handle Penjual Registration -> LANGSUNG KE HALAMAN UTAMA PENJUAL TANPA LOGIN LAGI
  const handleMerchRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !merchOwner ||
      !merchStoreName ||
      !merchEmail ||
      !merchPassword ||
      !merchPhone ||
      !merchStoreAddress
    ) {
      setAlertBanner({ type: 'error', message: 'Semua data usaha dan outlet wajib diisi.' });
      return;
    }

    if (!uploadedNib || !uploadedKtp || !uploadedNpwp) {
      setAlertBanner({
        type: 'error',
        message: 'Harap unggah seluruh berkas legalitas: NIB, KTP Pemilik, dan NPWP.'
      });
      return;
    }

    // Check if email already registered -> redirect to login
    if (registeredEmails.includes(merchEmail.toLowerCase().trim())) {
      setAlertBanner({
        type: 'info',
        message: `Email '${merchEmail}' sudah terdaftar! Mengalihkan ke halaman login...`
      });
      setLoginEmail(merchEmail);
      setTimeout(() => {
        setAuthMode('login');
      }, 1200);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const sellerProfile: UserProfile = {
        name: merchOwner,
        ownerName: merchOwner,
        storeName: merchStoreName,
        email: merchEmail,
        phone: merchPhone,
        address: merchStoreAddress,
        role: 'Penjual',
        nibNumber: '9120003849182 (Valid OSS RI)',
        ktpNumber: '3174**********01',
        npwpNumber: '82.193.***.*-013.000',
        registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      };

      showToast('Pendaftaran Mitra Berhasil!', `Toko ${merchStoreName} langsung aktif dan siap beroperasi.`);
      // Langsung menuju ke halaman utama penjual tanpa perlu login lagi
      onAuthSuccess('Penjual', sellerProfile);
    }, 900);
  };

  // Reset Password Handlers
  const handleSendResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setAlertBanner({ type: 'error', message: 'Harap masukkan email akun terdaftar Anda.' });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setResetStep('verify-otp');
      setResetOtp('948215'); // Autofill demo OTP
      setAlertBanner({
        type: 'success',
        message: `Kode verifikasi OTP 6 digit telah dikirimkan ke '${resetEmail}'. (Gunakan kode demo: 948215)`
      });
      showToast('Kode OTP Terkirim', `Kode verifikasi reset telah dikirim ke ${resetEmail}.`);
    }, 700);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetOtp.length < 6) {
      setAlertBanner({ type: 'error', message: 'Kode OTP harus 6 digit angka.' });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setResetStep('new-password');
      setAlertBanner({
        type: 'success',
        message: 'Kode OTP terverifikasi! Silakan buat kata sandi baru untuk akun Anda.'
      });
      showToast('OTP Terverifikasi', 'Silakan buat kata sandi baru.');
    }, 600);
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetNewPassword.length < 6) {
      setAlertBanner({ type: 'error', message: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setAlertBanner({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setLoginEmail(resetEmail);
      setLoginPassword(resetNewPassword);
      setAuthMode('login');
      setResetStep('input-email');
      setAlertBanner({
        type: 'success',
        message: 'Kata sandi berhasil diperbarui! Silakan login dengan kata sandi baru Anda.'
      });
      showToast('Kata Sandi Diperbarui!', 'Kata sandi baru telah disimpan dan siap digunakan.');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-12">
      {/* Top Bar Accent */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-[#dee8ff]">
        <button
          type="button"
          onClick={onBackToRoleSelect}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#dee8ff] shadow-xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Ganti Pilihan Role</span>
        </button>

        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="Logo" className="h-7 w-auto object-contain" />
          <span className="text-base font-extrabold text-[#111c2d]">MakanDulu</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
            userRole === 'Pembeli' ? 'bg-[#ffdbce] text-[#a33900]' : 'bg-[#ffddb8] text-[#825100]'
          }`}>
            Portal {userRole}
          </span>
        </div>
      </div>

      {/* Main Authentication Box */}
      <div className="w-full max-w-2xl mx-auto my-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#dee8ff] shadow-xl">
          {/* Header Title */}
          <div className="text-center mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              userRole === 'Pembeli' ? 'bg-[#ffdbce] text-[#a33900]' : 'bg-[#ffddb8] text-[#825100]'
            }`}>
              {authMode === 'login'
                ? `Login Masuk • ${userRole}`
                : authMode === 'preferences'
                ? `Preferensi Selera Kuliner`
                : authMode === 'reset-password'
                ? `Reset Kata Sandi • ${userRole}`
                : `Pendaftaran Akun Baru • ${userRole}`}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d] tracking-tight">
              {authMode === 'login'
                ? `Selamat Datang, ${userRole}!`
                : authMode === 'preferences'
                ? `Pilih Selera & Preferensi Makanan`
                : authMode === 'reset-password'
                ? `Lupa Kata Sandi Akun?`
                : `Daftar Akun ${userRole} MakanDulu`}
            </h2>
            <p className="text-xs sm:text-sm text-[#5a4138] mt-1">
              {authMode === 'login'
                ? 'Masukkan email dan password akun Anda untuk melanjutkan.'
                : authMode === 'preferences'
                ? `Halo ${custName || 'Sahabat Kuliner'}, pilih cita rasa dan kategori makanan favoritmu!`
                : authMode === 'reset-password'
                ? 'Atur ulang kata sandi akun Anda secara instan dengan verifikasi kode OTP.'
                : userRole === 'Pembeli'
                ? 'Lengkapi formulir data diri pendaftaran pembeli untuk membuat akun baru.'
                : 'Lengkapi formulir pendaftaran mitra toko kuliner dan unggah dokumen legalitas (NIB, KTP, NPWP).'}
            </p>
          </div>

          {/* Mode Switcher Tabs (Login vs Daftar) - Hidden when selecting preferences or resetting password */}
          {authMode !== 'preferences' && authMode !== 'reset-password' && (
            <div className="flex items-center p-1 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAlertBanner(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  authMode === 'login'
                    ? 'bg-white text-[#111c2d] shadow-sm'
                    : 'text-[#5a4138] hover:text-[#111c2d]'
                }`}
              >
                Sudah Punya Akun (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAlertBanner(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  authMode === 'register'
                    ? userRole === 'Pembeli'
                      ? 'bg-[#a33900] text-white shadow-sm'
                      : 'bg-[#825100] text-white shadow-sm'
                    : 'text-[#5a4138] hover:text-[#111c2d]'
                }`}
              >
                Belum Punya Akun (Daftar)
              </button>
            </div>
          )}

          {/* Alert Message Banner */}
          {alertBanner && (
            <div
              className={`mb-6 p-4 rounded-2xl text-xs flex items-start gap-3 transition-all ${
                alertBanner.type === 'error'
                  ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]'
                  : alertBanner.type === 'info'
                  ? 'bg-[#dee8ff] text-[#111c2d] border border-[#cfdaf2]'
                  : 'bg-[#6ffbbe]/40 text-[#002113] border border-[#6cf8bb]'
              }`}
            >
              <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                {alertBanner.type === 'error' ? 'error' : alertBanner.type === 'info' ? 'info' : 'check_circle'}
              </span>
              <div className="flex-1 leading-relaxed">{alertBanner.message}</div>
              <button
                type="button"
                onClick={() => setAlertBanner(null)}
                className="text-xs hover:opacity-75"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 1. HALAMAN LOGIN: HANYA EMAIL & PASSWORD AKUN SAJA */}
          {/* ========================================================= */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
                  Email Akun Terdaftar *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
                  Password Akun *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan password akun"
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] hover:text-[#111c2d]"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Lupa Kata Sandi Trigger */}
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset-password');
                    setResetStep('input-email');
                    setResetEmail(loginEmail);
                    setAlertBanner(null);
                  }}
                  className="text-xs text-[#a33900] hover:underline font-bold transition-colors"
                >
                  Lupa kata sandi?
                </button>
              </div>

              {/* Quick Demo Credentials Autofill
              <div className="p-3 rounded-xl bg-[#f0f3ff] border border-[#dee8ff] flex items-center justify-between text-xs">
                <span className="text-[#5a4138]">Akun Pengujian QA:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (userRole === 'Pembeli') {
                      setLoginEmail('siti.rahma@domain.com');
                      setLoginPassword('PasswordAman123!');
                    } else {
                      setLoginEmail('resto.juara@makan.id');
                      setLoginPassword('PasswordAman123!');
                    }
                    showToast('Kredensial Terisi', 'Siap melakukan login.');
                  }}
                  className="font-bold text-[#a33900] hover:underline"
                >
                  Isi Otomatis
                </button>
              </div> */}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                    userRole === 'Pembeli'
                      ? 'bg-[#a33900] hover:bg-[#cc4900]'
                      : 'bg-[#825100] hover:bg-[#a36700]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">login</span>
                      <span>Masuk Sebagai {userRole}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-3 text-xs text-[#5a4138]">
                Belum punya akun {userRole}?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAlertBanner(null);
                  }}
                  className="font-bold text-[#a33900] hover:underline"
                >
                  Daftar Sekarang
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAMPILAN RESET PASSWORD JIKA LUPA PASSWORD */}
          {/* ========================================================= */}
          {authMode === 'reset-password' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#cc4900] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-xl">lock_reset</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#111c2d]">
                    Atur Ulang Kata Sandi Akun {userRole}
                  </h3>
                  <p className="text-[11px] text-[#5a4138]">
                    Masukkan email terdaftar untuk verifikasi OTP dan mengganti kata sandi akun Anda.
                  </p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center justify-between text-xs px-2 py-1">
                <div className={`flex items-center gap-1.5 ${resetStep === 'input-email' ? 'text-[#a33900] font-bold' : 'text-[#006c49] font-medium'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${resetStep === 'input-email' ? 'bg-[#a33900] text-white' : 'bg-[#6ffbbe] text-[#004d33]'}`}>
                    {resetStep === 'input-email' ? '1' : '✓'}
                  </span>
                  <span>1. Email</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-[#dee8ff]"></div>
                <div className={`flex items-center gap-1.5 ${resetStep === 'verify-otp' ? 'text-[#a33900] font-bold' : resetStep === 'new-password' ? 'text-[#006c49] font-medium' : 'text-[#5a4138]'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${resetStep === 'verify-otp' ? 'bg-[#a33900] text-white' : resetStep === 'new-password' ? 'bg-[#6ffbbe] text-[#004d33]' : 'bg-[#dee8ff] text-[#5a4138]'}`}>
                    {resetStep === 'new-password' ? '✓' : '2'}
                  </span>
                  <span>2. OTP</span>
                </div>
                <div className="h-0.5 flex-1 mx-2 bg-[#dee8ff]"></div>
                <div className={`flex items-center gap-1.5 ${resetStep === 'new-password' ? 'text-[#a33900] font-bold' : 'text-[#5a4138]'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${resetStep === 'new-password' ? 'bg-[#a33900] text-white' : 'bg-[#dee8ff] text-[#5a4138]'}`}>
                    3
                  </span>
                  <span>3. Sandi Baru</span>
                </div>
              </div>

              {/* Tahap 1: Input Email */}
              {resetStep === 'input-email' && (
                <form onSubmit={handleSendResetOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
                      Email Akun {userRole} Terdaftar *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-lg">
                        mail
                      </span>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Contoh: nama@domain.com"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        <span>Mengirim Kode OTP...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">send</span>
                        <span>Kirim Kode OTP Verifikasi</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Tahap 2: Input OTP */}
              {resetStep === 'verify-otp' && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#111c2d]">
                        Masukkan Kode OTP 6 Digit *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetOtp('948215');
                          showToast('Kode Terisi', 'Kode demo 948215 dimasukkan.');
                        }}
                        className="text-[11px] font-bold text-[#a33900] hover:underline"
                      >
                        Isi Kode Demo (948215)
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-lg">
                        pin
                      </span>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        placeholder="6 digit kode verifikasi"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#f0f3ff] text-sm tracking-widest font-mono font-bold focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                    </div>
                    <p className="text-[10px] text-[#5a4138] mt-1">
                      Kode telah dikirim ke <strong>{resetEmail}</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setResetStep('input-email')}
                      className="px-4 py-3 rounded-xl bg-white hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold border border-[#dee8ff]"
                    >
                      Ubah Email
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                          <span>Memverifikasi...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">verified_user</span>
                          <span>Verifikasi Kode OTP</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Tahap 3: Input Password Baru */}
              {resetStep === 'new-password' && (
                <form onSubmit={handleSaveNewPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
                      Kata Sandi Baru *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-lg">
                        lock
                      </span>
                      <input
                        type={showResetNewPassword ? 'text' : 'password'}
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a4138]"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showResetNewPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
                      Konfirmasi Kata Sandi Baru *
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5a4138] text-lg">
                        lock_reset
                      </span>
                      <input
                        type={showResetConfirmPassword ? 'text' : 'password'}
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a4138]"
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showResetConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                        <span>Menyimpan Kata Sandi Baru...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        <span>Simpan Kata Sandi Baru & Masuk</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Kembali ke Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAlertBanner(null);
                  }}
                  className="text-xs font-bold text-[#5a4138] hover:text-[#111c2d] flex items-center justify-center gap-1 mx-auto"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Kembali ke Halaman Login</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. FORMULIR PENDAFTARAN PEMBELI */}
          {/* (Nama, Email, Password, Nomor Telepon, Alamat) */}
          {/* Setelah submit -> Mengarah ke PILIH PREFERENSI MAKANAN */}
          {/* ========================================================= */}
          {authMode === 'register' && userRole === 'Pembeli' && (
            <form onSubmit={handleCustRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#111c2d] mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Contoh: Siti Rahmawati"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111c2d] mb-1">
                    Alamat Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111c2d] mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={custPassword}
                    onChange={(e) => setCustPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111c2d] mb-1">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111c2d] mb-1">
                  Alamat Lengkap Pengiriman *
                </label>
                <textarea
                  rows={3}
                  required
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      <span>Menyimpan Data Diri...</span>
                    </>
                  ) : (
                    <>
                      <span>Pilih Preferensi Makanan</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 text-xs text-[#5a4138]">
                Sudah punya akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAlertBanner(null);
                  }}
                  className="font-bold text-[#a33900] hover:underline"
                >
                  Login di sini
                </button>
              </div>
            </form>
          )}

          {/* ========================================================= */}
          {/* HALAMAN MEMILIH PREFERENSI MAKANAN (SETELAH DAFTAR) */}
          {/* Setelah selesai memilih -> DIARAHKAN KE MENU LOGIN PEMBELI */}
          {/* ========================================================= */}
          {authMode === 'preferences' && userRole === 'Pembeli' && (
            <div className="space-y-6">
              <div className="p-4 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#a33900] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">restaurant</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#111c2d]">
                    Preferensi Selera Kuliner Anda
                  </h3>
                  <p className="text-[11px] text-[#5a4138]">
                    Pilih rasa dan kategori makanan yang paling Anda sukai. Setelah ini, Anda akan diarahkan ke menu login akun.
                  </p>
                </div>
              </div>

              {/* Tingkat & Rasa Favorit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#111c2d] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#a33900]"></span>
                    <span>Cita Rasa Favorit (Bisa pilih lebih dari satu)</span>
                  </label>
                  <span className="text-[10px] text-[#5a4138]">Multiselect</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'pedas', label: 'Pedas Nampol', emoji: '🔥', desc: 'Cabai rawit & korek' },
                    { id: 'manis', label: 'Manis Legit', emoji: '🍯', desc: 'Kecap manis gurih' },
                    { id: 'gurih', label: 'Gurih Mantap', emoji: '🧂', desc: 'Bumbu kuning rempah' },
                    { id: 'asam', label: 'Asam Segar', emoji: '🍋', desc: 'Jeruk limau & kuah' },
                    { id: 'rempah', label: 'Rempah Kuat', emoji: '🌿', desc: 'Kapulaga & cengkeh' },
                    { id: 'sehat', label: 'Rendah Kalori', emoji: '🥗', desc: 'Sehat & segar' }
                  ].map((taste) => {
                    const isSelected = selectedTastes.includes(taste.id);
                    return (
                      <button
                        key={taste.id}
                        type="button"
                        onClick={() => toggleTaste(taste.id)}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-[#a33900] text-white border-[#a33900] shadow-sm'
                            : 'bg-[#f0f3ff] text-[#111c2d] border-[#dee8ff] hover:bg-[#dee8ff]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{taste.emoji}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          )}
                        </div>
                        <span className="text-xs font-bold block mt-1">{taste.label}</span>
                        <span className={`text-[10px] block ${isSelected ? 'text-[#ffdbce]' : 'text-[#5a4138]'}`}>
                          {taste.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kategori Kuliner Favorit */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#111c2d] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#cc4900]"></span>
                    <span>Kategori Kuliner Favorit</span>
                  </label>
                  <span className="text-[10px] text-[#5a4138]">Multiselect</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'ayam_bebek', label: 'Bebek & Ayam Krispi', emoji: '🍗' },
                    { id: 'nasi_bakar', label: 'Nasi Bakar Daun Pisang', emoji: '🍃' },
                    { id: 'soto_kuah', label: 'Soto & Makanan Berkuah', emoji: '🥣' },
                    { id: 'seafood', label: 'Seafood & Ikan Bakar', emoji: '🦐' },
                    { id: 'camilan', label: 'Camilan & Gorengan Gurih', emoji: '🥟' },
                    { id: 'minuman', label: 'Minuman Dingin & Es Segar', emoji: '🍹' }
                  ].map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-[#cc4900] text-white border-[#cc4900] shadow-sm'
                            : 'bg-[#f0f3ff] text-[#111c2d] border-[#dee8ff] hover:bg-[#dee8ff]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{cat.emoji}</span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                          )}
                        </div>
                        <span className="text-xs font-bold block mt-1">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pantangan Makanan (Opsional) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#111c2d] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
                    <span>Pantangan / Catatan Khusus (Opsional)</span>
                  </label>
                  <span className="text-[10px] text-[#5a4138]">Alergen</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'aman_lambung', label: 'Aman untuk Lambung' },
                    { id: 'bebas_kacang', label: 'Bebas Kacang (Nut-Free)' },
                    { id: 'bebas_seafood', label: 'Bebas Seafood' },
                    { id: 'bebas_gluten', label: 'Bebas Gluten' },
                    { id: 'rendah_gula', label: 'Rendah Gula (Less Sugar)' }
                  ].map((diet) => {
                    const isSelected = selectedDietary.includes(diet.id);
                    return (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => toggleDietary(diet.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[#006c49] text-white border-[#006c49]'
                            : 'bg-white text-[#5a4138] border-[#dee8ff] hover:bg-[#f0f3ff]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {diet.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button: SIMPAN PREFERENSI & LANGSUNG KE BERANDA PEMBELI */}
              <div className="pt-3 border-t border-[#dee8ff]">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSavePreferencesSubmit}
                  className="w-full py-3.5 rounded-2xl bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                      <span>Menyiapkan Beranda Kuliner Anda...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan Preferensi & Langsung Masuk ke Beranda Pembeli</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-[#5a4138] mt-2">
                  *Setelah memilih preferensi makanan, Anda akan langsung diarahkan ke halaman utama pembeli tanpa perlu login lagi.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. FORMULIR PENDAFTARAN PENJUAL */}
          {/* (Nama Pemilik, Nama Toko, Email, Password, Nomor Telepon, Alamat Toko, serta unggah NIB, KTP, NPWP) */}
          {/* ========================================================= */}
          {authMode === 'register' && userRole === 'Penjual' && (
            <form onSubmit={handleMerchRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111c2d] mb-1">
                    Nama Pemilik Usaha *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchOwner}
                    onChange={(e) => setMerchOwner(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111c2d] mb-1">
                    Nama Toko / Restoran *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchStoreName}
                    onChange={(e) => setMerchStoreName(e.target.value)}
                    placeholder="Contoh: Resto Bebek Juara"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111c2d] mb-1">
                    Email Bisnis Restoran *
                  </label>
                  <input
                    type="email"
                    required
                    value={merchEmail}
                    onChange={(e) => setMerchEmail(e.target.value)}
                    placeholder="resto.juara@makan.id"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#111c2d] mb-1">
                    Password Toko *
                  </label>
                  <input
                    type="password"
                    required
                    value={merchPassword}
                    onChange={(e) => setMerchPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111c2d] mb-1">
                  Nomor Telepon Toko / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={merchPhone}
                  onChange={(e) => setMerchPhone(e.target.value)}
                  placeholder="082199887766"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111c2d] mb-1">
                  Alamat Lengkap Toko / Dapur Outlet *
                </label>
                <textarea
                  rows={2}
                  required
                  value={merchStoreAddress}
                  onChange={(e) => setMerchStoreAddress(e.target.value)}
                  placeholder="Jl. Raya Kebayoran Baru No. 12, Jakarta Selatan..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs border border-[#dee8ff] focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none resize-none"
                />
              </div>

              {/* Unggah Berkas: NIB, KTP, NPWP */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#111c2d] mb-1.5">
                  Unggah Berkas Legalitas Wajib (NIB, KTP Pemilik, NPWP) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Dokumen 1: NIB */}
                  <div
                    onClick={() => {
                      setUploadedNib('NIB_RestoBebekJuara.pdf');
                      showToast('Dokumen Diunggah', 'NIB berhasil dipilih.');
                    }}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f0f3ff] text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[#825100] text-xl">
                      {uploadedNib ? 'check_circle' : 'description'}
                    </span>
                    <span className="text-xs font-bold text-[#111c2d]">1. NIB Usaha *</span>
                    <span className="text-[10px] text-[#5a4138]">
                      {uploadedNib || 'Klik untuk unggah NIB'}
                    </span>
                  </div>

                  {/* Dokumen 2: KTP */}
                  <div
                    onClick={() => {
                      setUploadedKtp('KTP_BudiSantoso.jpg');
                      showToast('Dokumen Diunggah', 'KTP berhasil dipilih.');
                    }}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f0f3ff] text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[#825100] text-xl">
                      {uploadedKtp ? 'check_circle' : 'badge'}
                    </span>
                    <span className="text-xs font-bold text-[#111c2d]">2. KTP Pemilik *</span>
                    <span className="text-[10px] text-[#5a4138]">
                      {uploadedKtp || 'Klik untuk unggah KTP'}
                    </span>
                  </div>

                  {/* Dokumen 3: NPWP */}
                  <div
                    onClick={() => {
                      setUploadedNpwp('NPWP_WarungSelera.pdf');
                      showToast('Dokumen Diunggah', 'NPWP berhasil dipilih.');
                    }}
                    className="p-3.5 rounded-2xl border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f0f3ff] text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[#825100] text-xl">
                      {uploadedNpwp ? 'check_circle' : 'receipt'}
                    </span>
                    <span className="text-xs font-bold text-[#111c2d]">3. NPWP Usaha *</span>
                    <span className="text-[10px] text-[#5a4138]">
                      {uploadedNpwp || 'Klik untuk unggah NPWP'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
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
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAlertBanner(null);
                  }}
                  className="font-bold text-[#825100] hover:underline"
                >
                  Login di sini
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#5a4138] pt-4">
        © 2026 MakanDulu Indonesia. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
};

export const AlurAutentikasiPeran = RoleAuthFlow;
