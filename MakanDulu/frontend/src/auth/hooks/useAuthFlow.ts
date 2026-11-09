import { useState } from 'react';
import { UserProfile } from '../../types';
import { registerPembeli, registerPenjual } from '../../services/registrasiPengguna';
import { login } from '../../services/loginPengguna';
import {
  requestPasswordReset,
  saveNewPassword,
  verifyPasswordResetOtp,
} from '../../services/resetPassword';
import { AlertBanner, AuthMode, ResetStep } from '../types';
import { isValidEmail, isValidIndonesianPhoneNumber } from '../validasi';

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
  const [resetToken, setResetToken] = useState('');
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
    if (!isValidEmail(loginEmail)) {
      return showError('Format email tidak valid. Pastikan memiliki nama pengguna, satu karakter @, domain, dan ekstensi tanpa spasi.');
    }
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
    if (!isValidEmail(custEmail)) {
      return showError('Format email tidak valid. Pastikan memiliki nama pengguna, satu karakter @, domain, dan ekstensi tanpa spasi.');
    }
    if (!isValidIndonesianPhoneNumber(custPhone)) {
      return showError('Nomor tidak valid!');
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
    if (!isValidEmail(merchEmail)) {
      return showError('Format email tidak valid. Pastikan memiliki nama pengguna, satu karakter @, domain, dan ekstensi tanpa spasi.');
    }
    if (!isValidIndonesianPhoneNumber(merchPhone)) {
      return showError('Nomor handphone harus berupa nomor Indonesia tanpa spasi atau karakter khusus, contoh 6281377654632 atau 083748989875.');
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

  const handleSendResetOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValidEmail(resetEmail)) {
      return showError('Masukkan email akun yang valid.');
    }
    setIsSubmitting(true);
    clearAlert();
    try {
      const data = await requestPasswordReset({
        email: resetEmail.trim(),
        role: userRole,
      });
      setResetStep('verify-otp');
      setResetOtp('');
      setAlertBanner({ type: 'success', message: data.message });
      showToast('Kode OTP Terkirim', `Kode verifikasi reset telah dikirim ke ${resetEmail}.`);
    } catch (error) {
      console.error('Request reset OTP error:', error);
      showError(error instanceof Error ? error.message : 'Gagal mengirim kode OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(resetOtp)) return showError('Kode OTP harus 6 digit angka.');
    setIsSubmitting(true);
    clearAlert();
    try {
      const data = await verifyPasswordResetOtp({
        email: resetEmail.trim(),
        role: userRole,
        kodeOtp: resetOtp,
      });
      if (!data.resetToken) throw new Error('Token reset password tidak diterima.');
      setResetToken(data.resetToken);
      setResetStep('new-password');
      setAlertBanner({ type: 'success', message: data.message });
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      showError(error instanceof Error ? error.message : 'Kode OTP tidak valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (resetNewPassword.length < 8) return showError('Kata sandi baru minimal 8 karakter.');
    if (resetNewPassword !== resetConfirmPassword) return showError('Konfirmasi kata sandi baru tidak cocok.');
    setIsSubmitting(true);
    clearAlert();
    try {
      const data = await saveNewPassword({
        email: resetEmail.trim(),
        role: userRole,
        resetToken,
        newPassword: resetNewPassword,
      });
      setLoginEmail(resetEmail);
      setLoginPassword('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetToken('');
      setResetStep('input-email');
      setAuthMode('login');
      setAlertBanner({ type: 'success', message: data.message });
    } catch (error) {
      console.error('Save new password error:', error);
      showError(error instanceof Error ? error.message : 'Gagal mengubah password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    authMode, setAuthMode, isSubmitting, alertBanner, setAlertBanner, clearAlert,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, showPassword, setShowPassword,
    resetEmail, setResetEmail, resetStep, setResetStep, resetOtp, setResetOtp,
    resetNewPassword, setResetNewPassword, resetConfirmPassword, setResetConfirmPassword,
    resetToken,
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

export type AuthFlow = ReturnType<typeof useAuthFlow>;
