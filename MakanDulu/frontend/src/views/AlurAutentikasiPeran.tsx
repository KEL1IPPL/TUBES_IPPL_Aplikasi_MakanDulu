import React from 'react';
import { LOGO_URL } from '../data/dataMock';
import { BuyerRegistrationForm } from '../auth/components/BuyerRegistrationForm';
import { LoginForm } from '../auth/components/LoginForm';
import { PreferencesForm } from '../auth/components/PreferencesForm';
import { ResetPasswordForm } from '../auth/components/ResetPasswordForm';
import { SellerRegistrationForm } from '../auth/components/SellerRegistrationForm';
import { useAuthFlow } from '../auth/hooks/useAuthFlow';
import { AuthViewProps } from '../auth/types';

export const RoleAuthFlow: React.FC<AuthViewProps> = (props) => {
  const { userRole, onBackToRoleSelect, showToast } = props;
  const auth = useAuthFlow(props);
  const setField = (field: string, value: string) => {
    const setters: Record<string, (value: string) => void> = {
      name: auth.setCustName, email: auth.setCustEmail, password: auth.setCustPassword,
      phone: auth.setCustPhone, address: auth.setCustAddress, owner: auth.setMerchOwner,
      store: auth.setMerchStoreName,
    };
    setters[field]?.(value);
  };
  const setSellerField = (field: string, value: string) => {
    const setters: Record<string, (value: string) => void> = {
      email: auth.setMerchEmail, password: auth.setMerchPassword, phone: auth.setMerchPhone, address: auth.setMerchStoreAddress,
    };
    setters[field]?.(value);
  };
  const header = auth.authMode === 'login' ? `Login Masuk • ${userRole}` : auth.authMode === 'preferences' ? 'Preferensi Selera Kuliner' : auth.authMode === 'reset-password' ? `Reset Kata Sandi • ${userRole}` : `Pendaftaran Akun Baru • ${userRole}`;
  const title = auth.authMode === 'login' ? `Selamat Datang, ${userRole}!` : auth.authMode === 'preferences' ? 'Pilih Selera & Preferensi Makanan' : auth.authMode === 'reset-password' ? 'Lupa Kata Sandi Akun?' : `Daftar Akun ${userRole} MakanDulu`;
  return <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-12">
    <div className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-[#dee8ff]"><button type="button" onClick={onBackToRoleSelect} className="px-3.5 py-2 rounded-xl bg-white text-[#111c2d] text-xs font-bold border border-[#dee8ff]"><span className="material-symbols-outlined text-base">arrow_back</span> Ganti Pilihan Role</button><div className="flex items-center gap-2"><img src={LOGO_URL} alt="Logo" className="h-7 w-auto" /><span className="font-extrabold">MakanDulu</span><span className="px-2.5 py-0.5 rounded-full text-xs font-bold">{userRole}</span></div></div>
    <main className="w-full max-w-2xl mx-auto my-8"><div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#dee8ff] shadow-xl"><div className="text-center mb-6"><span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase bg-[#ffdbce] text-[#a33900]">{header}</span><h2 className="text-2xl sm:text-3xl font-extrabold text-[#111c2d]">{title}</h2></div>
      {auth.alertBanner && <div className={`mb-6 p-4 rounded-2xl text-xs ${auth.alertBanner.type === 'error' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#dee8ff] text-[#111c2d]'}`}>{auth.alertBanner.message}<button type="button" onClick={auth.clearAlert} className="float-right">×</button></div>}
      {auth.authMode !== 'preferences' && auth.authMode !== 'reset-password' && <nav className="flex gap-1 p-1 bg-[#f0f3ff] rounded-2xl mb-6"><button type="button" onClick={() => auth.setAuthMode('login')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${auth.authMode === 'login' ? 'bg-white shadow-sm' : ''}`}>Login</button><button type="button" onClick={() => auth.setAuthMode('register')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${auth.authMode === 'register' ? 'bg-[#a33900] text-white' : ''}`}>Daftar</button></nav>}
      {auth.authMode === 'login' && <LoginForm userRole={userRole} isSubmitting={auth.isSubmitting} setAuthMode={auth.setAuthMode} setAlertBanner={auth.setAlertBanner} email={auth.loginEmail} password={auth.loginPassword} showPassword={auth.showPassword} setEmail={auth.setLoginEmail} setPassword={auth.setLoginPassword} setShowPassword={auth.setShowPassword} onSubmit={auth.handleLoginSubmit} onForgotPassword={() => { auth.setResetEmail(auth.loginEmail); auth.setResetStep('input-email'); auth.setAuthMode('reset-password'); }} />}
      {auth.authMode === 'register' && userRole === 'Pembeli' && <BuyerRegistrationForm userRole={userRole} isSubmitting={auth.isSubmitting} setAuthMode={auth.setAuthMode} setAlertBanner={auth.setAlertBanner} values={{ name: auth.custName, email: auth.custEmail, password: auth.custPassword, phone: auth.custPhone, address: auth.custAddress }} onChange={setField} onSubmit={auth.handleBuyerRegistration} />}
      {auth.authMode === 'register' && userRole === 'Penjual' && <SellerRegistrationForm userRole={userRole} isSubmitting={auth.isSubmitting} setAuthMode={auth.setAuthMode} setAlertBanner={auth.setAlertBanner} values={{ owner: auth.merchOwner, store: auth.merchStoreName, email: auth.merchEmail, password: auth.merchPassword, phone: auth.merchPhone, address: auth.merchStoreAddress }} files={{ nib: auth.uploadedNib, ktp: auth.uploadedKtp, npwp: auth.uploadedNpwp }} onChange={setSellerField} onFile={(field, value) => { const setters: Record<string, (value: string) => void> = { nib: auth.setUploadedNib, ktp: auth.setUploadedKtp, npwp: auth.setUploadedNpwp }; setters[field]?.(value); }} onSubmit={auth.handleSellerRegistration} showToast={showToast} />}
      {auth.authMode === 'preferences' && <PreferencesForm tastes={auth.selectedTastes} categories={auth.selectedCategories} dietary={auth.selectedDietary} loading={auth.isSubmitting} toggleTaste={auth.toggleTaste} toggleCategory={auth.toggleCategory} toggleDietary={auth.toggleDietary} onSubmit={auth.handleSavePreferences} />}
      {auth.authMode === 'reset-password' && <ResetPasswordForm step={auth.resetStep} email={auth.resetEmail} otp={auth.resetOtp} newPassword={auth.resetNewPassword} confirmPassword={auth.resetConfirmPassword} loading={auth.isSubmitting} showNewPassword={auth.showResetNewPassword} showConfirmPassword={auth.showResetConfirmPassword} setEmail={auth.setResetEmail} setOtp={auth.setResetOtp} setNewPassword={auth.setResetNewPassword} setConfirmPassword={auth.setResetConfirmPassword} setShowNewPassword={auth.setShowResetNewPassword} setShowConfirmPassword={auth.setShowResetConfirmPassword} onSendOtp={auth.handleSendResetOtp} onVerifyOtp={auth.handleVerifyOtp} onSavePassword={auth.handleSaveNewPassword} onBack={() => auth.setAuthMode('login')} />}
    </div></main><footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#5a4138]">© 2026 MakanDulu Indonesia. Seluruh hak cipta dilindungi.</footer>
  </div>;
};

export const AlurAutentikasiPeran = RoleAuthFlow;
