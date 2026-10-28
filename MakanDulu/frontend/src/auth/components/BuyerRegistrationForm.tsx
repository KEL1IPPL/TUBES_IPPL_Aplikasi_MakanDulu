import React from 'react';
import { AuthFormProps } from '../types';
import { Input, Label, SubmitButton, Textarea } from './FormControls';

interface Props extends AuthFormProps { values: Record<string, string>; onChange: (field: string, value: string) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; }

export const BuyerRegistrationForm = ({ values, onChange, onSubmit, isSubmitting, setAuthMode }: Props) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div><Label>Nama Lengkap *</Label><Input required value={values.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Contoh: Siti Rahmawati" /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Alamat Email *</Label><Input type="email" required value={values.email} onChange={(e) => onChange('email', e.target.value)} placeholder="nama@email.com" /></div><div><Label>Password *</Label><Input type="password" required value={values.password} onChange={(e) => onChange('password', e.target.value)} placeholder="Minimal 8 karakter" /></div></div>
    <div><Label>Nomor Telepon / WhatsApp *</Label><Input type="tel" required value={values.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="081234567890" /></div>
    <div><Label>Alamat Lengkap Pengiriman *</Label><Textarea rows={3} required value={values.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan..." /></div>
    <SubmitButton loading={isSubmitting} className="bg-[#a33900] hover:bg-[#cc4900]"><span>Pilih Preferensi Makanan</span><span className="material-symbols-outlined text-base">arrow_forward</span></SubmitButton>
    <p className="text-center text-xs text-[#5a4138]">Sudah punya akun? <button type="button" onClick={() => setAuthMode('login')} className="font-bold text-[#a33900] hover:underline">Login di sini</button></p>
  </form>
);
