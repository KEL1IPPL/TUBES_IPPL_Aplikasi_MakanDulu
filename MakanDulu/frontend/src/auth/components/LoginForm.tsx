import React from 'react';
import { AuthFormProps } from '../types';
import { Input, Label, SubmitButton } from './FormControls';

interface LoginFormProps extends AuthFormProps {
  email: string; password: string; showPassword: boolean;
  setEmail: (value: string) => void; setPassword: (value: string) => void;
  setShowPassword: (value: boolean) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onForgotPassword: () => void;
}

export const LoginForm = ({ isSubmitting, email, password, showPassword, setEmail, setPassword, setShowPassword, onSubmit, onForgotPassword, userRole, setAuthMode }: LoginFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div><Label>Email Akun Terdaftar *</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" /></div>
    <div><Label>Password Akun *</Label><div className="relative"><Input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password akun" className="pr-11" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5a4138]"><span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span></button></div></div>
    <div className="flex justify-end"><button type="button" onClick={onForgotPassword} className="text-xs text-[#a33900] hover:underline font-bold">Lupa kata sandi?</button></div>
    <SubmitButton loading={isSubmitting} className={userRole === 'Pembeli' ? 'bg-[#a33900] hover:bg-[#cc4900]' : 'bg-[#825100] hover:bg-[#a36700]'}><span className="material-symbols-outlined text-base">login</span><span>Masuk Sebagai {userRole}</span></SubmitButton>
    <p className="text-center text-xs text-[#5a4138]">Belum punya akun? <button type="button" onClick={() => setAuthMode('register')} className="font-bold text-[#a33900] hover:underline">Daftar Sekarang</button></p>
  </form>
);
