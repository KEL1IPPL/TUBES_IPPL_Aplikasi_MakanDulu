import { UserProfile } from '../types';

export type AuthMode = 'login' | 'register' | 'preferences' | 'reset-password';
export type ResetStep = 'input-email' | 'verify-otp' | 'new-password';
export type AlertBanner = {
  type: 'error' | 'success' | 'info';
  message: string;
} | null;

export interface AuthViewProps {
  userRole: 'Pembeli' | 'Penjual';
  onBackToRoleSelect: () => void;
  onAuthSuccess: (userRole: 'Pembeli' | 'Penjual', userProfile?: UserProfile) => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

export interface AuthFormProps {
  userRole: 'Pembeli' | 'Penjual';
  isSubmitting: boolean;
  setAuthMode: (mode: AuthMode) => void;
  setAlertBanner: (alert: AlertBanner) => void;
}
