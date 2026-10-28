import React from 'react';
import { ResetStep } from '../types';
import { Input, Label, SubmitButton } from './FormControls';

interface Props {
  step: ResetStep; email: string; otp: string; newPassword: string; confirmPassword: string; loading: boolean;
  showNewPassword: boolean; showConfirmPassword: boolean; setEmail: (value: string) => void; setOtp: (value: string) => void;
  setNewPassword: (value: string) => void; setConfirmPassword: (value: string) => void; setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void; onSendOtp: (event: React.FormEvent<HTMLFormElement>) => void;
  onVerifyOtp: (event: React.FormEvent<HTMLFormElement>) => void; onSavePassword: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

export const ResetPasswordForm = (props: Props) => {
  const { step, email, otp, newPassword, confirmPassword, loading, setEmail, setOtp, setNewPassword, setConfirmPassword, setShowNewPassword, setShowConfirmPassword, onSendOtp, onVerifyOtp, onSavePassword, onBack } = props;
  if (step === 'input-email') return <form onSubmit={onSendOtp} className="space-y-4"><Label>Email Akun Terdaftar *</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@domain.com" /><SubmitButton loading={loading} className="bg-[#a33900]">Kirim Kode OTP Verifikasi</SubmitButton></form>;
  if (step === 'verify-otp') return <form onSubmit={onVerifyOtp} className="space-y-4"><Label>Masukkan Kode OTP 6 Digit *</Label><Input inputMode="numeric" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="948215" /><SubmitButton loading={loading} className="bg-[#a33900]">Verifikasi OTP</SubmitButton></form>;
  return <form onSubmit={onSavePassword} className="space-y-4"><div><Label>Password Baru *</Label><div className="relative"><Input type={props.showNewPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pr-10" /><button type="button" onClick={() => setShowNewPassword(!props.showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><span className="material-symbols-outlined text-sm">{props.showNewPassword ? 'visibility_off' : 'visibility'}</span></button></div></div><div><Label>Konfirmasi Password *</Label><div className="relative"><Input type={props.showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pr-10" /><button type="button" onClick={() => setShowConfirmPassword(!props.showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2"><span className="material-symbols-outlined text-sm">{props.showConfirmPassword ? 'visibility_off' : 'visibility'}</span></button></div></div><SubmitButton loading={loading} className="bg-[#a33900]">Simpan Password Baru</SubmitButton><button type="button" onClick={onBack} className="w-full text-xs font-bold">Kembali ke Login</button></form>;
};
