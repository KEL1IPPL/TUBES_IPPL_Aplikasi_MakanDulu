import { useState } from 'react';
import { UserProfile } from '../../types';
import { login, registerPembeli, registerPenjual } from '../../services/authService';
import { AlertBanner, AuthMode, ResetStep } from '../types';

const registeredEmails = [
  'siti.rahma@domain.com',
  'resto.juara@makan.id',
  'budi.santoso@makan.id',
  'customer@domain.com',
];

interface UseAuthFlowProps {
  userRole: 'Pembeli' | 'Penjual';
  onAuthSuccess: (role: 'Pembeli' | 'Penjual', profile?: UserProfile) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export const useAuthFlow = ({
  userRole,
  onAuthSuccess,
  showToast,
}: UseAuthFlowProps) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertBanner, setAlertBanner] = useState<AlertBanner>(null);
  const [loginEmail, setLoginEmail] = useState(
    userRole === 'Pembeli' ? 'siti.rahma@domain.com' : 'resto.juara@makan.id'
  );
  const [loginPassword, setLoginPassword] = useState('PasswordAman123!');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState(loginEmail);
  const [resetStep, setResetStep] = useState<ResetStep>('input-email');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [selectedTastes, setSelectedTastes] = useState(['pedas', 'gurih']);
  const [selectedCategories, setSelectedCategories] = useState(['ayam_bebek', 'nasi_bakar']);
  const [selectedDietary, setSelectedDietary] = useState(['aman_lambung']);
  const [merchOwner, setMerchOwner] = useState('');
  const [merchStoreName, setMerchStoreName] = useState('');
  const [merchEmail, setMerchEmail] = useState('');
  const [merchPassword, setMerchPassword] = useState('');
  const [merchPhone, setMerchPhone] = useState('');
  const [merchStoreAddress, setMerchStoreAddress] = useState('');
  const [uploadedNib, setUploadedNib] = useState<string | null>(null);
  const [uploadedKtp, setUploadedKtp] = useState<string | null>(null);
  const [uploadedNpwp, setUploadedNpwp] = useState<string | null>(null);

  const showError = (message: string) => setAlertBanner({ type: 'error', message });
  const clearAlert = () => setAlertBanner(null);
  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) =>
    setter((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value]);

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!loginEmail.trim() || !loginPassword) return showError('Harap masukkan email dan kata sandi akun Anda.');
    setIsSubmitting(true);
    clearAlert();
    try {
      const data = await login({ email: loginEmail.trim(), password: loginPassword, role: userRole });
      if (!data.user || !data.token) throw new Error('Respons login tidak lengkap.');
      localStorage.setItem('makandulu_token', data.token);
      const profile: UserProfile = {
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        address: data.user.address,
        role: data.user.role,
        registeredAt: '',
        ...(data.user.role === 'Penjual' ? { ownerName: data.user.name, storeName: data.user.storeName } : {}),
      };
      showToast('Login Berhasil!', `Selamat datang kembali di MakanDulu (${data.user.role}).`);
      onAuthSuccess(data.user.role, profile);
    } catch (error) {
      console.error('Login error:', error);
      showError(error instanceof Error ? error.message : 'Tidak dapat terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyerRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (![custName, custEmail, custPassword, custPhone, custAddress].every(Boolean)) {
      return showError('Semua kolom formulir pendaftaran Pembeli wajib diisi.');
    }
    if (registeredEmails.includes(custEmail.toLowerCase().trim())) {
      setLoginEmail(custEmail);
      setAlertBanner({ type: 'info', message: `Email '${custEmail}' sudah terdaftar! Mengalihkan ke halaman login...` });
      return setTimeout(() => setAuthMode('login'), 1200);
    }
    setIsSubmitting(true);
    clearAlert();
    try {
      const data = await registerPembeli({
        name: custName.trim(), email: custEmail.trim(), password: custPassword,
        phone: custPhone.trim(), address: custAddress.trim(),
      });
      if (data.token) localStorage.setItem('makandulu_token', data.token);
      setLoginEmail(custEmail);
      setLoginPassword(custPassword);
      setAuthMode('preferences');
      showToast('Data Diri Tersimpan!', 'Silakan pilih selera preferensi makanan favorit Anda.');
    } catch (error) {
      console.error('Buyer registration error:', error);
      showError(error instanceof Error ? error.message : 'Registrasi Pembeli gagal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const profile: UserProfile = {
        name: custName || 'Siti Rahmawati', email: custEmail || 'siti.rahma@domain.com',
        phone: custPhone || '0812-3456-7890',
        address: custAddress || 'Jl. Sudirman No. 42 (Gedung B Lt. 3), Kebayoran Baru, Jakarta Selatan',
        role: 'Pembeli',
        registeredAt: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        preferences: { tastes: selectedTastes, categories: selectedCategories, dietary: selectedDietary },
      };
      setIsSubmitting(false);
      showToast('Pendaftaran Berhasil!', `Selamat datang di MakanDulu, ${custName || 'Sahabat Kuliner'}!`);
      onAuthSuccess('Pembeli', profile);
    }, 700);
  };

  const handleSellerRegistration = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (![merchOwner, merchStoreName, merchEmail, merchPassword, merchPhone, merchStoreAddress].every(Boolean)) {
      return showError('Semua data usaha dan outlet wajib diisi.');
    }
    if (!uploadedNib || !uploadedKtp || !uploadedNpwp) {
      return showError('Harap unggah seluruh berkas legalitas: NIB, KTP Pemilik, dan NPWP.');
    }
    if (registeredEmails.includes(merchEmail.toLowerCase().trim())) {
      setLoginEmail(merchEmail);
      setAlertBanner({ type: 'info', message: `Email '${merchEmail}' sudah terdaftar! Mengalihkan ke halaman login...` });
      return setTimeout(() => setAuthMode('login'), 1200);
    }
    setIsSubmitting(true);
    clearAlert();
    try {
      const data = await registerPenjual({
        ownerName: merchOwner.trim(), storeName: merchStoreName.trim(), email: merchEmail.trim(),
        password: merchPassword, phone: merchPhone.trim(), storeAddress: merchStoreAddress.trim(),
        nib: uploadedNib, ktp: uploadedKtp, npwp: uploadedNpwp,
      });
      if (!data.user || !data.token) throw new Error('Respons registrasi Penjual tidak lengkap.');
      localStorage.setItem('makandulu_token', data.token);
      showToast('Pendaftaran Mitra Berhasil!', `Toko ${merchStoreName} langsung aktif dan siap beroperasi.`);
      onAuthSuccess('Penjual', data.user);
    } catch (error) {
      console.error('Seller registration error:', error);
      showError(error instanceof Error ? error.message : 'Registrasi Penjual gagal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetOtp = (event: React.FormEvent) => {
    event.preventDefault();
    if (!resetEmail) return showError('Harap masukkan email akun terdaftar Anda.');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false); setResetStep('verify-otp'); setResetOtp('948215');
      setAlertBanner({ type: 'success', message: `Kode verifikasi OTP 6 digit telah dikirimkan ke '${resetEmail}'. (Gunakan kode demo: 948215)` });
      showToast('Kode OTP Terkirim', `Kode verifikasi reset telah dikirim ke ${resetEmail}.`);
    }, 700);
  };

  const handleVerifyOtp = (event: React.FormEvent) => {
    event.preventDefault();
    if (resetOtp.length < 6) return showError('Kode OTP harus 6 digit angka.');
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false); setResetStep('new-password');
      setAlertBanner({ type: 'success', message: 'Kode OTP terverifikasi! Silakan buat kata sandi baru untuk akun Anda.' });
    }, 600);
  };

  const handleSaveNewPassword = (event: React.FormEvent) => {
    event.preventDefault();
    if (resetNewPassword.length < 6) return showError('Kata sandi baru minimal 6 karakter.');
    if (resetNewPassword !== resetConfirmPassword) return showError('Konfirmasi kata sandi baru tidak cocok.');
    setLoginEmail(resetEmail); setLoginPassword(resetNewPassword); setAuthMode('login'); setResetStep('input-email');
    setAlertBanner({ type: 'success', message: 'Kata sandi berhasil diperbarui! Silakan login dengan kata sandi baru Anda.' });
  };

  return {
    authMode, setAuthMode, isSubmitting, alertBanner, setAlertBanner, clearAlert,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, showPassword, setShowPassword,
    resetEmail, setResetEmail, resetStep, setResetStep, resetOtp, setResetOtp,
    resetNewPassword, setResetNewPassword, resetConfirmPassword, setResetConfirmPassword,
    showResetNewPassword, setShowResetNewPassword, showResetConfirmPassword, setShowResetConfirmPassword,
    custName, setCustName, custEmail, setCustEmail, custPassword, setCustPassword,
    custPhone, setCustPhone, custAddress, setCustAddress, selectedTastes, selectedCategories, selectedDietary,
    toggleTaste: (value: string) => toggle(setSelectedTastes, value),
    toggleCategory: (value: string) => toggle(setSelectedCategories, value),
    toggleDietary: (value: string) => toggle(setSelectedDietary, value),
    merchOwner, setMerchOwner, merchStoreName, setMerchStoreName, merchEmail, setMerchEmail,
    merchPassword, setMerchPassword, merchPhone, setMerchPhone, merchStoreAddress, setMerchStoreAddress,
    uploadedNib, setUploadedNib, uploadedKtp, setUploadedKtp, uploadedNpwp, setUploadedNpwp,
    handleLoginSubmit, handleBuyerRegistration, handleSavePreferences, handleSellerRegistration,
    handleSendResetOtp, handleVerifyOtp, handleSaveNewPassword,
  };
};
