import React, { useState } from 'react';
import { UserProfile } from '../types';
import HalamanRegistrasiPembeli from './halaman_registrasi_pembeli';
import HalamanRegistrasiPenjual from './halaman_registrasi_penjual';

interface HalamanRegistrasiPenjualPembeliProps {
  initialRole?: 'Pembeli' | 'Penjual';
  onSuccess: (role: 'Pembeli' | 'Penjual', profile: UserProfile) => void;
  onNavigateToLogin: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanRegistrasiPenjualPembeli: React.FC<HalamanRegistrasiPenjualPembeliProps> = ({
  initialRole = 'Pembeli',
  onSuccess,
  onNavigateToLogin,
  showToast
}) => {
  const [activeRole, setActiveRole] = useState<'Pembeli' | 'Penjual'>(initialRole);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6">
      {/* Switcher Tab Dual-Role */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex p-1.5 bg-[#e7eeff] rounded-2xl border border-[#dee8ff]">
          <button
            type="button"
            onClick={() => setActiveRole('Pembeli')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeRole === 'Pembeli'
                ? 'bg-[#a33900] text-white shadow-sm'
                : 'text-[#5a4138] hover:text-[#111c2d]'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>Registrasi Pembeli</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('Penjual')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeRole === 'Penjual'
                ? 'bg-[#825100] text-white shadow-sm'
                : 'text-[#5a4138] hover:text-[#111c2d]'
            }`}
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            <span>Registrasi Penjual</span>
          </button>
        </div>
      </div>

      {activeRole === 'Pembeli' ? (
        <HalamanRegistrasiPembeli
          onSuccess={(profile) => onSuccess('Pembeli', profile)}
          onNavigateToLogin={onNavigateToLogin}
          showToast={showToast}
        />
      ) : (
        <HalamanRegistrasiPenjual
          onSuccess={(profile) => onSuccess('Penjual', profile)}
          onNavigateToLogin={onNavigateToLogin}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default HalamanRegistrasiPenjualPembeli;
