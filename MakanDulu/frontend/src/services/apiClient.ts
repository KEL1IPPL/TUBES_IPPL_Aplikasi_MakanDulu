import { UserProfile } from '../types';
import { UserPreferences } from '../types';

export const login = (payload: LoginPayload) =>
  postJson<AuthResponse, LoginPayload>('/api/auth/login', payload);


export interface LoginPayload {
  email: string;
  password: string;
  role: 'Pembeli' | 'Penjual';
}

export interface BuyerRegistrationPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface SellerRegistrationPayload {
  ownerName: string;
  storeName: string;
  email: string;
  password: string;
  phone: string;
  storeAddress: string;
  nib: string;
  ktp: string;
  npwp: string;
}

export interface SellerLegalFiles {
  nib: File;
  ktp: File;
  npwp: File;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserProfile & { id: number };
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const postJson = async <TResponse, TPayload>(
  endpoint: string,
  payload: TPayload
): Promise<TResponse> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as TResponse & {
    success?: boolean;
    message?: string;
  };

  if (!response.ok || data.success === false) {
    throw new ApiError(
      data.message || 'Permintaan ke server gagal.',
      response.status
    );
  }

  return data;
};

const requestRegistration = <TPayload>(
  endpoint: string,
  payload: TPayload
): Promise<AuthResponse> =>
  postJson<AuthResponse, TPayload>(`/api/auth/register/${endpoint}`, payload);

export const registerPembeli = (payload: BuyerRegistrationPayload) =>
  requestRegistration('pembeli', payload);

export const registerPenjual = (
  payload: SellerRegistrationPayload,
  files: SellerLegalFiles
) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
  formData.append('nibFile', files.nib);
  formData.append('ktpFile', files.ktp);
  formData.append('npwpFile', files.npwp);

  return fetch('/api/auth/register/penjual', {
    method: 'POST',
    body: formData,
  }).then(async (response) => {
    const data = (await response.json()) as AuthResponse;
    if (!response.ok || data.success === false) {
      throw new Error(data.message || 'Registrasi penjual gagal.');
    }
    return data;
  });
};

export interface PreferenceResponse {
  success: boolean;
  message: string;
  data: UserPreferences & {
    idPreferensi: number;
    idPembeli: number;
    updatedAt: string;
  };
}

export const simpanPreferensiMakanan = async (
  preferences: UserPreferences
): Promise<PreferenceResponse> => {
  const token = localStorage.getItem('makandulu_token');
  if (!token) {
    throw new Error('Sesi Pembeli tidak ditemukan. Silakan login kembali.');
  }

  const response = await fetch('/api/halaman-preferensi-makanan', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(preferences),
  });
  const data = (await response.json()) as PreferenceResponse;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Gagal menyimpan preferensi makanan.');
  }

  return data;
};

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

