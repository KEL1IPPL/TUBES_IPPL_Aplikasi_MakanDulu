import React from 'react';
import { LoginForm } from './LoginForm';
import { AuthFlow } from '../hooks/useAuthFlow';

interface Props {
  auth: AuthFlow;
  userRole: 'Pembeli' | 'Penjual';
}

export const LoginPengguna: React.FC<Props> = ({ auth, userRole }) => (
  <LoginForm
    userRole={userRole}
    isSubmitting={auth.isSubmitting}
    setAuthMode={auth.setAuthMode}
    setAlertBanner={auth.setAlertBanner}
    email={auth.loginEmail}
    password={auth.loginPassword}
    showPassword={auth.showPassword}
    setEmail={auth.setLoginEmail}
    setPassword={auth.setLoginPassword}
    setShowPassword={auth.setShowPassword}
    onSubmit={auth.handleLoginSubmit}
    onForgotPassword={() => {
      auth.setResetEmail(auth.loginEmail);
      auth.setResetStep('input-email');
      auth.setAuthMode('reset-password');
    }}
  />
);
