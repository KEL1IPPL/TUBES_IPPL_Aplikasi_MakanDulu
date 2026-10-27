import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface PortalAutentikasiProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  onNavigateToCatalog: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const PortalAutentikasi: React.FC<PortalAutentikasiProps> = ({
  userRole,
  setUserRole,
  onNavigateToCatalog,
  showToast
}) => {
  const [activeSection, setActiveSection] = useState<'role' | 'register' | 'pref' | 'login'>('role');
  const [regRoleTab, setRegRoleTab] = useState<'customer' | 'merchant'>('customer');
  const [loginRoleTab, setLoginRoleTab] = useState<'customer' | 'merchant'>('customer');

  // Registration form states
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custConfirmPassword, setCustConfirmPassword] = useState('');
  const [custAddress, setCustAddress] = useState('');

  const [merchOwner, setMerchOwner] = useState('');
  const [merchStoreName, setMerchStoreName] = useState('');
  const [merchEmail, setMerchEmail] = useState('');
  const [merchPhone, setMerchPhone] = useState('');
  const [merchPassword, setMerchPassword] = useState('');
  const [merchConfirmPassword, setMerchConfirmPassword] = useState('');
  const [merchAddress, setMerchAddress] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success';
    title: string;
    desc: string;
    action?: { label: string; onClick: () => void };
  } | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('siti.rahma@domain.com');
  const [loginPassword, setLoginPassword] = useState('PasswordAman123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Reset OTP modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [otpCells, setOtpCells] = useState<string[]>(['8', '4', '9', '2', '0', '1']);
  const [otpTimer, setOtpTimer] = useState<number>(58);
  const [resetIdentity, setResetIdentity] = useState('siti.rahma@domain.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetCompleted, setResetCompleted] = useState(false);

  // Preferences questionnaire state
  const [selectedTastes, setSelectedTastes] = useState<string[]>(['pedas', 'gurih']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['nasi', 'ayam']);

  // OTP Countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isResetModalOpen && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResetModalOpen, otpTimer]);

  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
    if (role === 'Pembeli') {
      setRegRoleTab('customer');
      setLoginRoleTab('customer');
    } else {
      setRegRoleTab('merchant');
      setLoginRoleTab('merchant');
    }
    showToast('Role Dipilih', `Identitas aktif diatur sebagai: ${role}`);
  };

  const handleSimulatedError = (code: number) => {
    switch (code) {
      case 1:
        setFeedback({
          type: 'error',
          title: 'Peringatan Validasi Wajib (Alert Error 1)',
          desc: 'Mohon lengkapi semua kolom yang wajib diisi. Nama, email, dan kata sandi tidak boleh kosong.'
        });
        break;
      case 2:
        setFeedback({
          type: 'error',
          title: 'Email Duplikat (Alert Error 2)',
          desc: 'Email sudah terdaftar di sistem MakanDulu. Silakan langsung masuk ke akunmu.',
          action: {
            label: 'Menuju Halaman Login →',
            onClick: () => setActiveSection('login')
          }
        });
        break;
      case 3:
        setFeedback({
          type: 'error',
          title: 'Format Email Tidak Valid (Alert Error 3)',
          desc: 'Format email tidak valid. Pastikan alamat memuat tanda "@" dan domain yang benar (contoh: user@makan.id).'
        });
        break;
      case 4:
        setFeedback({
          type: 'error',
          title: 'Konfirmasi Sandi Gagal (Alert Error 4)',
          desc: 'Kata sandi dan konfirmasi kata sandi tidak sesuai. Mohon periksa kembali karakter yang diketikkan.'
        });
        break;
      case 5:
        setFeedback({
          type: 'error',
          title: 'Nomor Telepon Tidak Valid (Alert Error 5)',
          desc: 'Format nomor telepon tidak valid. Pastikan diawali 08 atau +62 dengan panjang minimal 10 hingga 13 digit angka.'
        });
        break;
      case 6:
        setRegRoleTab('merchant');
        setFeedback({
          type: 'error',
          title: 'Dokumen Legalitas Ditolak (Alert Error 6)',
          desc: 'Dokumen NIB tidak sesuai. Sistem hanya menerima format PDF, JPG, atau PNG dengan ukuran maksimal 5 MB.'
        });
        break;
      default:
        break;
    }
  };

  const handleSimulatedSuccess = () => {
    setFeedback({
      type: 'success',
      title: 'Pendaftaran Berhasil!',
      desc: 'Akunmu telah berhasil dibuat di server MakanDulu. Lanjutkan ke personalisasi kuliner.'
    });
    setTimeout(() => {
      setActiveSection('pref');
    }, 1000);
  };

  const handleCustomerRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail || !custPassword) {
      handleSimulatedError(1);
      return;
    }
    if (!custEmail.includes('@') || !custEmail.includes('.')) {
      handleSimulatedError(3);
      return;
    }
    if (custPassword !== custConfirmPassword) {
      handleSimulatedError(4);
      return;
    }
    handleSimulatedSuccess();
  };

  const handleMerchantRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchOwner || !merchStoreName || !merchEmail) {
      handleSimulatedError(1);
      return;
    }
    handleSimulatedSuccess();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPassword === 'salah' || loginPassword === 'wrong') {
      setLoginError(true);
      setLoginSuccess(false);
      showToast('Autentikasi Gagal', 'Email atau kata sandi tidak sesuai.', true);
    } else {
      setLoginError(false);
      setLoginSuccess(true);
      showToast('Login Berhasil!', `Selamat datang kembali di MakanDulu (${loginRoleTab === 'customer' ? 'Pembeli' : 'Mitra Penjual'}).`);
      setTimeout(() => {
        onNavigateToCatalog();
      }, 1000);
    }
  };

  const toggleTaste = (tasteId: string) => {
    setSelectedTastes((prev) =>
      prev.includes(tasteId) ? prev.filter((x) => x !== tasteId) : [...prev, tasteId]
    );
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((x) => x !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
      {/* Brand Header Accent & System Scope Bar */}
      <div className="relative w-full bg-[#f0f3ff] rounded-2xl p-6 mb-8 shadow-sm overflow-hidden border border-[#dee8ff]">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#a33900]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#ffdbce] text-[#a33900] text-[11px] font-bold uppercase tracking-wider">
                Portal Gerbang Autentikasi
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#6cf8bb]/50 text-[#006c49] text-[11px] font-bold">
                <span className="inline-block w-2 h-2 rounded-full bg-[#006c49] mr-1.5 animate-pulse"></span>
                Server Ready • MakanDulu Core v2.4
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#111c2d]">
              Gerbang Masuk & Identitas Layanan Kuliner
            </h1>
            <p className="text-xs sm:text-sm text-[#5a4138] mt-1 max-w-3xl leading-relaxed">
              Simulasi terpadu verifikasi alur UC #1 (Pilih Role), UC #2 (Registrasi Dual-Mode), UC #3 (Preferensi Selera), UC #4 (Login), dan UC #5 (Reset Password via OTP).
            </p>
          </div>

          {/* Flow Navigator Tabs */}
          <div className="flex items-center gap-2 bg-[#e7eeff] p-1.5 rounded-xl self-start md:self-auto overflow-x-auto border border-[#dee8ff]">
            {[
              { id: 'role', label: 'UC #1 Role', icon: 'badge' },
              { id: 'register', label: 'UC #2 Daftar', icon: 'how_to_reg' },
              { id: 'pref', label: 'UC #3 Preferensi', icon: 'soup_kitchen' },
              { id: 'login', label: 'UC #4 & #5 Login/OTP', icon: 'login' }
            ].map((nav) => {
              const isActive = activeSection === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => setActiveSection(nav.id as any)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#a33900] shadow-sm'
                      : 'text-[#5a4138] hover:text-[#111c2d]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{nav.icon}</span>
                  <span>{nav.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 1: UC #1 - ROLE SELECTION */}
      {activeSection === 'role' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a33900] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                1
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#111c2d] tracking-tight">
                  UC #1: Pemilihan Role Pengguna
                </h2>
                <p className="text-xs text-[#5a4138]">
                  Tentukan identitas operasional di platform MakanDulu untuk memuat hak akses personal.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6ffbbe] text-[#002113] text-xs font-bold shadow-xs">
              <span className="material-symbols-outlined text-[16px]">cloud_done</span>
              <span>Role Tersimpan ke Server: <strong>{userRole === 'Pembeli' ? 'Pembeli (Customer)' : 'Penjual (Merchant)'}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Role Card */}
            <div
              onClick={() => handleSelectRole('Pembeli')}
              className={`group relative cursor-pointer rounded-2xl bg-white p-6 transition-all duration-300 border ${
                userRole === 'Pembeli'
                  ? 'border-[#a33900] shadow-xl ring-2 ring-[#a33900]/20'
                  : 'border-[#dee8ff] shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-2xl bg-[#ffdbce] flex items-center justify-center text-[#a33900] shadow-xs group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-3xl">ramen_dining</span>
                </div>
                <span className={`material-symbols-outlined text-2xl transition-opacity ${
                  userRole === 'Pembeli' ? 'text-[#a33900] opacity-100' : 'text-gray-300 opacity-20'
                }`}>
                  check_circle
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#ffdbce] text-[#a33900] text-[10px] font-bold uppercase">
                    Konsumen
                  </span>
                  <span className="text-[#5a4138] text-[11px] font-mono">ID: ROLE_CUSTOMER</span>
                </div>
                <h3 className="text-lg font-bold text-[#111c2d] mt-2 group-hover:text-[#a33900] transition-colors">
                  Pembeli (Customer)
                </h3>
                <p className="text-xs text-[#5a4138] mt-2 leading-relaxed">
                  Jelajahi ribuan kuliner favorit nusantara, pesan instan, lacak pengantaran real-time dengan bukti foto (POD), kumpulkan promo cashback & beri ulasan bintang kuliner.
                </p>
              </div>

              <div className="mt-6 pt-4 bg-[#f0f3ff] -mx-6 -mb-6 p-6 rounded-b-2xl flex items-center justify-between border-t border-[#dee8ff]">
                <div className="flex items-center gap-2 text-[#5a4138] text-xs">
                  <span className="material-symbols-outlined text-[#006c49] text-base">verified</span>
                  <span>Akses cepat tanpa verifikasi legalitas</span>
                </div>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    userRole === 'Pembeli'
                      ? 'bg-[#a33900] text-white'
                      : 'bg-white text-[#111c2d] hover:bg-[#dee8ff]'
                  }`}
                >
                  Pilih Pembeli
                </button>
              </div>
            </div>

            {/* Merchant Role Card */}
            <div
              onClick={() => handleSelectRole('Penjual')}
              className={`group relative cursor-pointer rounded-2xl bg-white p-6 transition-all duration-300 border ${
                userRole === 'Penjual'
                  ? 'border-[#825100] shadow-xl ring-2 ring-[#825100]/20'
                  : 'border-[#dee8ff] shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-16 h-16 rounded-2xl bg-[#ffddb8] flex items-center justify-center text-[#825100] shadow-xs group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-3xl">storefront</span>
                </div>
                <span className={`material-symbols-outlined text-2xl transition-opacity ${
                  userRole === 'Penjual' ? 'text-[#825100] opacity-100' : 'text-gray-300 opacity-20'
                }`}>
                  check_circle
                </span>
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#ffddb8] text-[#825100] text-[10px] font-bold uppercase">
                    Mitra Usaha
                  </span>
                  <span className="text-[#5a4138] text-[11px] font-mono">ID: ROLE_MERCHANT</span>
                </div>
                <h3 className="text-lg font-bold text-[#111c2d] mt-2 group-hover:text-[#825100] transition-colors">
                  Penjual (Merchant)
                </h3>
                <p className="text-xs text-[#5a4138] mt-2 leading-relaxed">
                  Buka kedai makanan online, kelola pesanan & stok menu, terima order instan dengan notifikasi timer 10 menit, upload bukti pengantaran & pantau analitik omzet warung.
                </p>
              </div>

              <div className="mt-6 pt-4 bg-[#f0f3ff] -mx-6 -mb-6 p-6 rounded-b-2xl flex items-center justify-between border-t border-[#dee8ff]">
                <div className="flex items-center gap-2 text-[#5a4138] text-xs">
                  <span className="material-symbols-outlined text-[#a33900] text-base">assignment_late</span>
                  <span>Wajib unggah NIB/KTP/NPWP</span>
                </div>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-xs ${
                    userRole === 'Penjual'
                      ? 'bg-[#825100] text-white'
                      : 'bg-white text-[#111c2d] hover:bg-[#dee8ff]'
                  }`}
                >
                  Pilih Penjual
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#dee8ff]/60 border border-[#dee8ff]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#a33900]">info</span>
              <span className="text-xs sm:text-sm text-[#111c2d]">
                Pilihan role akan otomatis menyesuaikan formulir registrasi & form login berikutnya.
              </span>
            </div>
            <button
              onClick={() => setActiveSection('register')}
              className="px-5 py-2.5 bg-[#a33900] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#cc4900] transition-all flex items-center gap-2"
            >
              <span>Lanjut ke Pendaftaran</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: UC #2 - DUAL-MODE REGISTRATION */}
      {activeSection === 'register' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a33900] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                2
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#111c2d] tracking-tight">
                  UC #2: Formulir Registrasi Akun
                </h2>
                <p className="text-xs text-[#5a4138]">
                  Dual-mode register untuk konsumen dan verifikasi legalitas outlet mitra usaha.
                </p>
              </div>
            </div>

            {/* Switcher Tab */}
            <div className="inline-flex p-1 bg-[#e7eeff] rounded-xl border border-[#dee8ff]">
              <button
                onClick={() => {
                  setRegRoleTab('customer');
                  setFeedback(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  regRoleTab === 'customer'
                    ? 'bg-white text-[#a33900] shadow-sm'
                    : 'text-[#5a4138] hover:text-[#111c2d]'
                }`}
              >
                Daftar Pembeli
              </button>
              <button
                onClick={() => {
                  setRegRoleTab('merchant');
                  setFeedback(null);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  regRoleTab === 'merchant'
                    ? 'bg-white text-[#825100] shadow-sm'
                    : 'text-[#5a4138] hover:text-[#111c2d]'
                }`}
              >
                Daftar Penjual (Merchant)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column (Col-7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#dee8ff]">
              {/* Dynamic feedback banner */}
              {feedback && (
                <div
                  className={`mb-6 p-4 rounded-xl flex items-start gap-3 transition-all ${
                    feedback.type === 'error'
                      ? 'bg-[#ffdad6] text-[#93000a] border border-[#ffb4ab]'
                      : 'bg-[#6ffbbe]/40 text-[#002113] border border-[#6cf8bb]'
                  }`}
                >
                  <span className="material-symbols-outlined mt-0.5">
                    {feedback.type === 'error' ? 'report' : 'check_circle'}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold">{feedback.title}</h4>
                    <p className="text-xs mt-0.5 leading-relaxed">{feedback.desc}</p>
                    {feedback.action && (
                      <button
                        onClick={feedback.action.onClick}
                        className="mt-2 px-3 py-1 bg-[#a33900] text-white text-[11px] font-bold rounded shadow-xs hover:bg-[#cc4900]"
                      >
                        {feedback.action.label}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setFeedback(null)}
                    className="text-xs hover:opacity-75"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              )}

              {/* Form Pembeli (Customer) */}
              {regRoleTab === 'customer' ? (
                <form onSubmit={handleCustomerRegSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0f3ff]">
                    <span className="text-sm font-bold text-[#111c2d]">Data Akun Pembeli Baru</span>
                    <span className="text-[10px] font-mono text-[#006c49] bg-[#6ffbbe]/50 px-2 py-0.5 rounded font-bold">
                      Form Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="Contoh: Siti Rahmawati"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Nomor WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                      Alamat Email *
                    </label>
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="siti.rahma@domain.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Kata Sandi *
                      </label>
                      <input
                        type="password"
                        value={custPassword}
                        onChange={(e) => setCustPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Konfirmasi Kata Sandi *
                      </label>
                      <input
                        type="password"
                        value={custConfirmPassword}
                        onChange={(e) => setCustConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                      Alamat Lengkap Pengiriman *
                    </label>
                    <textarea
                      rows={3}
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff] resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#a33900] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#cc4900] transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">person_add</span>
                      <span>Daftar Akun Pembeli</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Form Penjual / Merchant */
                <form onSubmit={handleMerchantRegSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#f0f3ff]">
                    <span className="text-sm font-bold text-[#111c2d]">Data Usaha Kuliner & Outlet</span>
                    <span className="text-[10px] font-mono text-[#825100] bg-[#ffddb8]/60 px-2 py-0.5 rounded font-bold">
                      Verifikasi Legalitas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Nama Pemilik Usaha *
                      </label>
                      <input
                        type="text"
                        value={merchOwner}
                        onChange={(e) => setMerchOwner(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none border border-[#dee8ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Nama Toko / Restoran *
                      </label>
                      <input
                        type="text"
                        value={merchStoreName}
                        onChange={(e) => setMerchStoreName(e.target.value)}
                        placeholder="Contoh: Resto Bebek Juara"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none border border-[#dee8ff]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Email Bisnis Restoran *
                      </label>
                      <input
                        type="email"
                        value={merchEmail}
                        onChange={(e) => setMerchEmail(e.target.value)}
                        placeholder="resto.juara@makan.id"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none border border-[#dee8ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Nomor WhatsApp Toko *
                      </label>
                      <input
                        type="tel"
                        value={merchPhone}
                        onChange={(e) => setMerchPhone(e.target.value)}
                        placeholder="082199887766"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none border border-[#dee8ff]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Kata Sandi Toko *
                      </label>
                      <input
                        type="password"
                        value={merchPassword}
                        onChange={(e) => setMerchPassword(e.target.value)}
                        placeholder="Minimal 8 karakter"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none border border-[#dee8ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                        Konfirmasi Kata Sandi *
                      </label>
                      <input
                        type="password"
                        value={merchConfirmPassword}
                        onChange={(e) => setMerchConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none border border-[#dee8ff]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                      Alamat Outlet / Dapur Utama *
                    </label>
                    <textarea
                      rows={2}
                      value={merchAddress}
                      onChange={(e) => setMerchAddress(e.target.value)}
                      placeholder="Jl. Raya Kebayoran Baru No. 12, Jakarta Selatan..."
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#825100] outline-none border border-[#dee8ff] resize-none"
                    />
                  </div>

                  {/* Drag-and-drop Berkas Legalitas */}
                  <div>
                    <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                      Unggah Berkas Legalitas (NIB, KTP Pemilik, NPWP) *
                    </label>
                    <div
                      onClick={() => {
                        const fakeFile = 'dokumen_legalitas_nib_bebek_juara.pdf (2.4 MB)';
                        setUploadedFileName(fakeFile);
                        showToast('Berkas Dipilih', fakeFile);
                      }}
                      className="cursor-pointer relative p-6 rounded-2xl bg-[#f0f3ff] hover:bg-[#e7eeff] border-2 border-dashed border-[#dee8ff] transition-all flex flex-col items-center justify-center text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#ffddb8] text-[#825100] flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                      </div>
                      <p className="text-xs font-bold text-[#111c2d]">
                        {uploadedFileName
                          ? 'Berkas telah terpilih (Klik untuk mengganti)'
                          : 'Tarik berkas NIB/KTP ke sini atau klik untuk jelajah'}
                      </p>
                      <p className="text-[11px] text-[#5a4138] mt-1 font-mono">
                        Format yang didukung: PDF, JPG, PNG (Maksimal ukuran: 5 MB)
                      </p>
                      {uploadedFileName && (
                        <div className="mt-3 inline-flex px-3 py-1 rounded-full bg-[#6ffbbe] text-[#002113] text-[11px] font-bold items-center gap-1.5 shadow-xs">
                          <span className="material-symbols-outlined text-[16px]">check</span>
                          <span>{uploadedFileName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3 bg-[#825100] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#a36700] transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">store</span>
                      <span>Daftar Sebagai Mitra Penjual</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Test Suite / Alternative Flow Simulator (Col-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#f0f3ff] rounded-2xl p-6 shadow-sm border border-[#dee8ff]">
                <div className="flex items-center gap-2 text-[#a33900] text-xs font-bold uppercase tracking-wider mb-2">
                  <span className="material-symbols-outlined text-[18px]">bug_report</span>
                  <span>Simulasi Validasi & Error Feedback (UC #2)</span>
                </div>
                <p className="text-xs text-[#5a4138] mb-4 leading-relaxed">
                  Klik skenario di bawah ini untuk menguji tanggapan antarmuka terhadap seluruh kondisi alternatif kegagalan input pendaftaran:
                </p>

                <div className="space-y-2">
                  {[
                    { id: 1, label: 'Kolom wajib kosong (Empty fields)' },
                    { id: 2, label: 'Email sudah terdaftar (Duplicate email)' },
                    { id: 3, label: 'Format email invalid (Missing @ / domain)' },
                    { id: 4, label: 'Kata sandi tidak sesuai (Mismatch password)' },
                    { id: 5, label: 'Format nomor telepon invalid' },
                    { id: 6, label: 'Dokumen NIB invalid (>5MB / salah tipe)' }
                  ].map((scen) => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => handleSimulatedError(scen.id)}
                      className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#e7eeff] transition-all flex items-center justify-between border border-[#dee8ff] group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center font-bold text-[10px]">
                          {scen.id}
                        </span>
                        <span className="text-xs text-[#111c2d]">{scen.label}</span>
                      </div>
                      <span className="material-symbols-outlined text-[#8e7166] group-hover:text-[#a33900] text-[18px]">
                        play_circle
                      </span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleSimulatedSuccess}
                    className="w-full text-left p-3 rounded-xl bg-[#6ffbbe]/40 hover:bg-[#6ffbbe]/70 transition-all flex items-center justify-between border border-[#6cf8bb] group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                      <span className="text-xs text-[#111c2d] font-bold">
                        Simulasi Berhasil → Alihkan ke Preferensi
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[#006c49] text-[18px]">
                      task_alt
                    </span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#dee8ff] text-[#5a4138] text-[11px] font-mono space-y-1">
                <p className="font-bold text-[#111c2d]">Status Pengujian QA:</p>
                <p>• Endpoint: <span className="text-[#a33900] font-bold">POST /api/v1/auth/register</span></p>
                <p>• Enkripsi sandi: Argon2id salt + hash</p>
                <p>• Antivirus dokumen NIB: ClamAV scanning active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: UC #3 - PREFERENCES QUESTIONNAIRE */}
      {activeSection === 'pref' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a33900] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                3
              </div>
              <div>
                <p className="text-xs text-[#5a4138]">
                  Personalisasi beranda otomatis sesuai lidah dan minat kuliner pelanggan.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#ffdbce] text-[#a33900] rounded-full text-xs font-bold uppercase">
              Langkah Opsional / Dapat Dilewati
            </span>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#dee8ff]">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#f0f3ff]">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#ffdbce] flex items-center justify-center text-[#a33900] font-extrabold text-2xl shadow-xs">
                  SR
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#111c2d]">
                      Hai Siti! Pilih Selera Kuliner Favoritmu
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#6ffbbe] text-[#002113] text-[10px] font-bold">
                      Pengguna Baru
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#5a4138] mt-1 leading-relaxed">
                    Kami akan mempersonalisasi rekomendasi menu di beranda MakanDulu agar sajian terhangat langsung menyambutmu!
                  </p>
                </div>
              </div>

              <div className="bg-[#f0f3ff] px-4 py-3 rounded-2xl flex items-center gap-3 border border-[#dee8ff] shrink-0">
                <div className="text-right">
                  <span className="block text-[11px] font-mono text-[#5a4138]">Pilihan Terpilih</span>
                  <span className="font-extrabold text-lg text-[#a33900]">
                    {selectedTastes.length + selectedCategories.length} Selera
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#a33900] text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {/* Taste choices */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[#111c2d] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a33900]"></span>
                    <span>Pilihan Rasa Favorit</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#5a4138]">Bisa pilih lebih dari satu</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { id: 'pedas', emoji: '🔥', label: 'Pedas Nampol' },
                    { id: 'manis', emoji: '🍯', label: 'Manis Legit' },
                    { id: 'gurih', emoji: '🧂', label: 'Gurih Mantap' },
                    { id: 'asam', emoji: '🍋', label: 'Asam Segar' },
                    { id: 'rempah', emoji: '🌿', label: 'Rempah Alami' },
                    { id: 'sehat', emoji: '🥗', label: 'Sehat Rendah Kalori' }
                  ].map((taste) => {
                    const isSelected = selectedTastes.includes(taste.id);
                    return (
                      <button
                        key={taste.id}
                        type="button"
                        onClick={() => toggleTaste(taste.id)}
                        className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all border ${
                          isSelected
                            ? 'bg-[#a33900] text-white border-[#a33900] shadow-sm'
                            : 'bg-[#f0f3ff] text-[#111c2d] border-[#dee8ff] hover:bg-[#dee8ff]'
                        }`}
                      >
                        <span className="text-2xl">{taste.emoji}</span>
                        <span>{taste.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Culinary categories */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-[#111c2d] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></span>
                    <span>Kategori Sajian Makanan</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#5a4138]">
                    Sesuaikan dengan pola makan harian
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { id: 'nasi', icon: 'dinner_dining', label: 'Nasi & Lauk' },
                    { id: 'mie', icon: 'ramen_dining', label: 'Mie & Bakso' },
                    { id: 'ayam', icon: 'set_meal', label: 'Ayam & Bebek' },
                    { id: 'kopi', icon: 'local_cafe', label: 'Kopi & Minuman' },
                    { id: 'camilan', icon: 'bakery_dining', label: 'Camilan Gurih' },
                    { id: 'sambal', icon: 'kitchen', label: 'Aneka Sambal' }
                  ].map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all border ${
                          isSelected
                            ? 'bg-[#006c49] text-white border-[#006c49] shadow-sm'
                            : 'bg-[#f0f3ff] text-[#111c2d] border-[#dee8ff] hover:bg-[#dee8ff]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Sample Preview */}
              <div className="p-4 rounded-2xl bg-[#dee8ff]/60 border border-[#cfdaf2] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#a33900] text-[28px]">
                    recommend
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#111c2d]">
                      Preview Rekomendasi Beranda Otomatis
                    </p>
                    <p className="text-xs text-[#5a4138] mt-0.5">
                      Menyiapkan: <strong>Nasi Bebek Sinjay Madura, Ayam Geprek Sambal Korek Level 5, Nasi Bakar Cumi</strong>.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 bg-white text-[#a33900] rounded-lg font-bold border border-[#dee8ff]">
                  AI Algorithm Active
                </span>
              </div>

              {/* Bottom Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#f0f3ff]">
                <button
                  type="button"
                  onClick={() => setActiveSection('login')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#5a4138] text-xs font-bold transition-all"
                >
                  Lewati (Skip)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Preferensi Tersimpan!', 'Rekomendasi beranda MakanDulu telah disesuaikan.');
                    setActiveSection('login');
                  }}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#a33900] text-white text-xs font-bold shadow-md hover:bg-[#cc4900] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">bookmark_added</span>
                  <span>Simpan & Lanjutkan ke Login</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: UC #4 & #5 - LOGIN & RESET OTP */}
      {activeSection === 'login' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#a33900] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                4
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#111c2d] tracking-tight">
                  UC #4 & #5: Login Dual-Role & Pemulihan Kata Sandi (OTP)
                </h2>
                <p className="text-xs text-[#5a4138]">
                  Sistem otentikasi aman dengan batas percobaan & mekanisme reset sandi terverifikasi OTP.
                </p>
              </div>
            </div>

            {/* Switch Role Login */}
            <div className="inline-flex p-1 bg-[#e7eeff] rounded-xl border border-[#dee8ff]">
              <button
                onClick={() => setLoginRoleTab('customer')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  loginRoleTab === 'customer'
                    ? 'bg-white text-[#a33900] shadow-sm'
                    : 'text-[#5a4138] hover:text-[#111c2d]'
                }`}
              >
                Login Pembeli
              </button>
              <button
                onClick={() => setLoginRoleTab('merchant')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  loginRoleTab === 'merchant'
                    ? 'bg-white text-[#825100] shadow-sm'
                    : 'text-[#5a4138] hover:text-[#111c2d]'
                }`}
              >
                Login Toko (Penjual)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Login Card (Col-7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#dee8ff]">
              {loginError && (
                <div className="mb-6 p-4 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-start justify-between border border-[#ffb4ab]">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] mt-0.5">warning</span>
                    <div>
                      <p className="text-xs font-bold">Autentikasi Gagal</p>
                      <p className="text-xs text-[#5a4138] mt-0.5">
                        Email atau password salah. Coba lagi atau gunakan reset kata sandi.
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setLoginError(false)}>
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              )}

              {loginSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-[#6ffbbe]/40 text-[#002113] flex items-center justify-between border border-[#6cf8bb]">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#006c49]">check_circle</span>
                    <p className="text-xs font-bold">Login Berhasil! Mengalihkan sesi ke katalog...</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#111c2d]">
                      {loginRoleTab === 'customer'
                        ? 'Email Pembeli Terdaftar'
                        : 'Email Bisnis Restoran / Toko'}
                    </label>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        loginRoleTab === 'customer'
                          ? 'bg-[#ffdbce] text-[#a33900]'
                          : 'bg-[#ffddb8] text-[#825100]'
                      }`}
                    >
                      {loginRoleTab === 'customer' ? 'AKUN PEMBELI' : 'AKUN MITRA PENJUAL'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-[#8e7166] text-[20px]">
                      mail
                    </span>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#111c2d]">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetModalOpen(true);
                        setResetCompleted(false);
                        setOtpTimer(58);
                      }}
                      className="text-xs text-[#a33900] font-bold hover:underline"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-3 text-[#8e7166] text-[20px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#8e7166] hover:text-[#111c2d]"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded accent-[#a33900]"
                    />
                    <span className="text-xs text-[#111c2d]">Ingat Saya selama 30 hari</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#5a4138] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#006c49]">lock</span>
                    <span>SSL 256-bit</span>
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className={`w-full py-3 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      loginRoleTab === 'customer'
                        ? 'bg-[#a33900] hover:bg-[#cc4900]'
                        : 'bg-[#825100] hover:bg-[#a36700]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">login</span>
                    <span>Login Masuk ke MakanDulu</span>
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-[#f0f3ff] text-center">
                <p className="text-xs text-[#5a4138]">
                  Belum punya akun MakanDulu?
                  <button
                    onClick={() => setActiveSection('register')}
                    className="text-[#a33900] font-bold hover:underline ml-1"
                  >
                    Daftar Sekarang
                  </button>
                </p>
              </div>
            </div>

            {/* UC #5 Reset Password Workflow Preview & QA Tools (Col-5) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#f0f3ff] rounded-2xl p-6 shadow-sm border border-[#dee8ff]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[#a33900] text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    <span>UC #5: Reset Password via OTP</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#6ffbbe] text-[#002113] text-[10px] font-bold">
                    Alur Siap Diuji
                  </span>
                </div>
                <p className="text-xs text-[#5a4138] mb-4 leading-relaxed">
                  Jika pengguna lupa kata sandi, sistem mengirimkan kode OTP 6-digit ke email/WhatsApp dengan proteksi rate limit countdown 60 detik (maksimal 3x request per menit).
                </p>

                <div className="p-4 rounded-xl bg-white border border-[#dee8ff] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#111c2d]">
                    <span>Simulasi Kode OTP SMS:</span>
                    <span className="font-mono tracking-widest text-[#a33900] bg-[#ffdbce] px-2 py-0.5 rounded font-extrabold">
                      849201
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#5a4138]">
                    <span>Masa Berlaku Token:</span>
                    <span>10 Menit</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#5a4138]">
                    <span>Countdown Kirim Ulang:</span>
                    <span className="text-[#ba1a1a] font-bold">{otpTimer}s</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetCompleted(false);
                    setOtpTimer(58);
                  }}
                  className="w-full mt-4 py-2.5 rounded-xl bg-white hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#dee8ff]"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  <span>Buka Modal Reset Password (OTP)</span>
                </button>
              </div>

              {/* Quick Debug Login Tester */}
              <div className="p-4 rounded-2xl bg-white border border-[#dee8ff] space-y-2">
                <p className="text-xs font-bold text-[#111c2d]">Tombol Cepat Pengujian (Reviewer QA):</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('siti.rahma@domain.com');
                      setLoginPassword('PasswordAman123!');
                      setLoginError(false);
                      showToast('Kredensial Valid Terisi', 'Klik tombol login untuk masuk.');
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#a33900] text-xs font-bold text-center transition-all border border-[#dee8ff]"
                  >
                    Isi Kredensial Valid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('user.unknown@domain.com');
                      setLoginPassword('salah');
                      setLoginError(false);
                      showToast('Kredensial Salah Terisi', 'Uji respons login gagal saat disubmit.');
                    }}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#ba1a1a] text-xs font-bold text-center transition-all border border-[#dee8ff]"
                  >
                    Isi Kredensial Salah
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIALOG: UC #5 RESET PASSWORD & OTP */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden border border-[#dee8ff]">
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-[#f0f3ff] flex items-center justify-center text-[#5a4138] hover:text-[#111c2d]"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">lock_reset</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111c2d]">Atur Ulang Kata Sandi</h3>
                <p className="text-xs text-[#5a4138]">Verifikasi kepemilikan akun via 6 digit kode OTP.</p>
              </div>
            </div>

            {!resetCompleted ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                    Email atau Nomor Telepon Terdaftar
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={resetIdentity}
                      onChange={(e) => setResetIdentity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setOtpTimer(58);
                        showToast('OTP Terkirim', 'Kode OTP 6-digit dikirim via WhatsApp: 849201');
                      }}
                      className="absolute right-2 top-2 px-3 py-1 bg-white hover:bg-[#dee8ff] text-[#111c2d] text-[11px] rounded-lg font-bold transition-all border border-[#dee8ff]"
                    >
                      Kirim OTP
                    </button>
                  </div>
                </div>

                {/* 6 Digit OTP Entry Box */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#111c2d]">
                      Masukkan 6-Digit Kode OTP
                    </label>
                    <span className="text-[11px] font-mono text-[#a33900] font-bold">
                      Simulasi OTP: 849201
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {otpCells.map((digit, idx) => (
                      <input
                        key={idx}
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newCells = [...otpCells];
                          newCells[idx] = val;
                          setOtpCells(newCells);
                        }}
                        className="w-full text-center py-2.5 rounded-xl bg-[#f0f3ff] text-[#111c2d] text-base font-bold focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] font-mono text-[#5a4138]">
                    <span>Tidak menerima kode?</span>
                    <div className="flex items-center gap-1.5">
                      <span>Kirim Ulang ({otpTimer}s)</span>
                      <button
                        disabled={otpTimer > 0}
                        onClick={() => {
                          setOtpTimer(58);
                          showToast('OTP Dikirim Ulang', 'Kode 849201 telah dikirim kembali.');
                        }}
                        className="text-[#a33900] font-bold disabled:opacity-40 hover:underline"
                      >
                        Kirim
                      </button>
                    </div>
                  </div>
                </div>

                {/* New Password Fields */}
                <div className="pt-2 border-t border-[#f0f3ff] space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                      Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter unik"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111c2d] mb-1">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#f0f3ff] text-xs focus:bg-white focus:ring-2 focus:ring-[#a33900] outline-none border border-[#dee8ff]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newPassword) {
                      showToast('Input Kurang', 'Masukkan kata sandi baru.', true);
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      showToast('Konfirmasi Gagal', 'Kata sandi baru tidak sama.', true);
                      return;
                    }
                    setResetCompleted(true);
                  }}
                  className="w-full mt-4 py-3 rounded-xl bg-[#a33900] text-white text-xs font-bold shadow-md hover:bg-[#cc4900] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  <span>Perbarui Kata Sandi Saya</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6 space-y-3 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-[#6ffbbe] text-[#006c49] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <h4 className="text-xl font-bold text-[#111c2d]">Kata Sandi Berhasil Diubah!</h4>
                <p className="text-xs text-[#5a4138] max-w-sm leading-relaxed">
                  Sistem telah memperbarui kredensial keamanan akunmu. Silakan gunakan kata sandi baru untuk masuk ke MakanDulu.
                </p>
                <button
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setLoginPassword(newPassword || 'PasswordBaru123!');
                    showToast('Siap Masuk', 'Kredensial baru terpasang di form login.');
                  }}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-[#a33900] text-white text-xs font-bold shadow-md hover:bg-[#cc4900]"
                >
                  Masuk Sekarang dengan Sandi Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const AuthPortalView = PortalAutentikasi;
export const TampilanPortalAutentikasi = PortalAutentikasi;
export default PortalAutentikasi;
