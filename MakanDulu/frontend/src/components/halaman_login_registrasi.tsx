import React, { useState } from 'react';
import { LOGO_URL } from '../data/dataMock';

interface HalamanLoginRegistrasiProps {
  userRole: 'Pembeli' | 'Penjual';
  onSelectMode: (mode: 'login' | 'register') => void;
  onBackToRoleSelect: () => void;
}

const HalamanLoginRegistrasi: React.FC<HalamanLoginRegistrasiProps> = ({
  userRole,
  onSelectMode,
  onBackToRoleSelect
}) => {
  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#dee8ff] shadow-xl text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <img src={LOGO_URL} alt="MakanDulu" className="h-9 w-auto" />
          <span className="text-2xl font-black text-[#111c2d]">MakanDulu</span>
        </div>

        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 ${
            userRole === 'Pembeli'
              ? 'bg-[#ffdbce] text-[#a33900]'
              : 'bg-[#ffddb8] text-[#825100]'
          }`}
        >
          Akses {userRole}
        </span>

        <h1 className="text-2xl font-extrabold text-[#111c2d] mb-2">
          Selamat Datang Kembali
        </h1>
        <p className="text-xs text-[#5a4138] leading-relaxed mb-8">
          Silakan tentukan apakah Anda ingin masuk ke akun yang sudah ada atau mendaftarkan akun baru.
        </p>

        <div className="space-y-3.5">
          <button
            type="button"
            onClick={() => onSelectMode('login')}
            className={`w-full py-3.5 px-5 rounded-2xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              userRole === 'Pembeli'
                ? 'bg-[#a33900] hover:bg-[#cc4900]'
                : 'bg-[#825100] hover:bg-[#a36700]'
            }`}
          >
            <span className="material-symbols-outlined text-lg">login</span>
            <span>Masuk ke Akun {userRole}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('register')}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] font-bold text-sm border border-[#dee8ff] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            <span>Daftar Akun Baru</span>
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#f0f3ff]">
          <button
            type="button"
            onClick={onBackToRoleSelect}
            className="text-xs text-[#5a4138] hover:text-[#111c2d] flex items-center justify-center gap-1.5 mx-auto font-semibold"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Kembali ke Pemilihan Peran</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HalamanLoginRegistrasi;
