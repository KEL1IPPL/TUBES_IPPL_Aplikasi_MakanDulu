import { postJson } from './apiClient';
import { AuthResponse } from './authTypes';

type ResetPasswordPayload = {
  email: string;
  role: 'Pembeli' | 'Penjual';
};

type VerifyOtpPayload = ResetPasswordPayload & {
  kodeOtp: string;
};

type SavePasswordPayload = ResetPasswordPayload & {
  resetToken: string;
  newPassword: string;
};

type ResetPasswordResponse = AuthResponse & {
  resetToken?: string;
};

export const requestPasswordReset = (payload: ResetPasswordPayload) =>
  postJson<ResetPasswordResponse, ResetPasswordPayload>(
    '/api/auth/password-reset/request',
    payload
  );

export const verifyPasswordResetOtp = (payload: VerifyOtpPayload) =>
  postJson<ResetPasswordResponse, VerifyOtpPayload>(
    '/api/auth/password-reset/verify',
    payload
  );

export const saveNewPassword = (payload: SavePasswordPayload) =>
  postJson<ResetPasswordResponse, SavePasswordPayload>(
    '/api/auth/password-reset/reset',
    payload
  );
