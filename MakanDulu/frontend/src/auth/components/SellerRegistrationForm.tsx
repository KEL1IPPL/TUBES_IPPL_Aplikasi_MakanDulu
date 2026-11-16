import React from 'react';
import { AuthFormProps } from '../types';
import { Input, Label, SubmitButton, Textarea } from './FormControls';

interface Props extends AuthFormProps { values: Record<string, string>; files: Record<string, File | null>; onChange: (field: string, value: string) => void; onFile: (field: string, value: File) => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; showToast: (title: string, message: string, isError?: boolean) => void; }

export const SellerRegistrationForm = ({ values, files, onChange, onFile, onSubmit, showToast, isSubmitting, setAuthMode }: Props) => {
  const documentFields = [['nib', 'NIB Usaha', 'description'], ['ktp', 'KTP Pemilik', 'badge'], ['npwp', 'NPWP Usaha', 'receipt']] as const;
  const handleFileChange = (field: string, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('File Tidak Valid', 'Berkas legalitas harus berupa gambar.', true);
      return;
    }
    if (file.size === 0) {
      showToast('File Tidak Valid', 'Berkas legalitas tidak boleh kosong.', true);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('File Terlalu Besar', 'Ukuran setiap berkas maksimal 2 MB.', true);
      return;
    }
    onFile(field, file);
    showToast('Dokumen Diunggah', `${file.name} berhasil dipilih.`);
  };
  return <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Nama Pemilik Usaha *</Label><Input required minLength={3} pattern="[A-Za-z]+( [A-Za-z]+)*" title="Nama minimal 3 karakter dan hanya boleh berisi huruf serta spasi." value={values.owner} onChange={(e) => onChange('owner', e.target.value)} placeholder="Contoh: Budi Santoso" /></div><div><Label>Nama Toko / Restoran *</Label><Input required value={values.store} onChange={(e) => onChange('store', e.target.value)} placeholder="Contoh: Resto Bebek Juara" /></div></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Email Bisnis Restoran *</Label><Input type="email" required value={values.email} onChange={(e) => onChange('email', e.target.value)} placeholder="resto.juara@makan.id" /></div><div><Label>Password Toko *</Label><Input type="password" required minLength={8} value={values.password} onChange={(e) => onChange('password', e.target.value)} placeholder="Minimal 8 karakter" /></div></div>
    <div><Label>Nomor Telepon Toko / WhatsApp *</Label><Input type="tel" required pattern="(?:08|628)[1-9][0-9]{7,10}" title="Gunakan nomor Indonesia tanpa spasi, contoh 6281377654632 atau 083748989875." inputMode="numeric" value={values.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="6281377654632" /></div>
    <div><Label>Alamat Lengkap Toko / Dapur Outlet *</Label><Textarea rows={2} required minLength={10} value={values.address} onChange={(e) => onChange('address', e.target.value)} placeholder="Jl. Raya Kebayoran Baru No. 12, Jakarta Selatan..." /></div>
    <Label>Unggah Berkas Legalitas Wajib (gambar, maksimal 2 MB) *</Label><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{documentFields.map(([key, label, icon]) => <label key={key} className="p-3.5 rounded-2xl border-2 border-dashed border-[#dee8ff] hover:border-[#825100] bg-[#f0f3ff] text-center cursor-pointer flex flex-col items-center gap-1"><input type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(key, e.target.files?.[0])} /><span className="material-symbols-outlined text-[#825100] text-xl">{files[key] ? 'check_circle' : icon}</span><span className="text-xs font-bold">{label} *</span><span className="text-[10px] text-[#5a4138]">{files[key]?.name || 'Klik untuk unggah'}</span></label>)}</div>
    <SubmitButton loading={isSubmitting} className="bg-[#825100] hover:bg-[#a36700]"><span className="material-symbols-outlined text-base">store</span><span>Daftar Sebagai Mitra Penjual</span></SubmitButton>
    <p className="text-center text-xs text-[#5a4138]">Sudah punya akun toko? <button type="button" onClick={() => setAuthMode('login')} className="font-bold text-[#825100] hover:underline">Login di sini</button></p>
  </form>;
};
