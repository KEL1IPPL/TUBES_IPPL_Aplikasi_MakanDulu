import React, { useState } from 'react';
import { UserProfile } from '../types';
import HalamanLoginPembeli from './halaman_login_pembeli';
import HalamanLoginPenjual from './halaman_login_penjual';

interface HalamanLoginPenjualPembeliProps {
  initialRole?: 'Pembeli' | 'Penjual';
  onSuccess: (role: 'Pembeli' | 'Penjual', profile: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

const HalamanLoginPenjualPembeli: React.FC<HalamanLoginPenjualPembeliProps> = ({
  initialRole = 'Pembeli',
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  showToast
}) => {
  const [activeRole, setActiveRole] = useState<'Pembeli' | 'Penjual'>(initialRole);

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6">
      {/* Switcher Tab Role */}
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
            <span>Login Pembeli</span>
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
            <span>Login Penjual</span>
          </button>
        </div>
      </div>

      {activeRole === 'Pembeli' ? (
        <HalamanLoginPembeli
          onSuccess={(profile) => onSuccess('Pembeli', profile)}
          onNavigateToRegister={onNavigateToRegister}
          onNavigateToForgotPassword={onNavigateToForgotPassword}
          showToast={showToast}
        />
      ) : (
        <HalamanLoginPenjual
          onSuccess={(profile) => onSuccess('Penjual', profile)}
          onNavigateToRegister={onNavigateToRegister}
          onNavigateToForgotPassword={onNavigateToForgotPassword}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default HalamanLoginPenjualPembeli;
