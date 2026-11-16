import { postJson } from './apiClient';
import {
  AuthResponse,
  BuyerRegistrationPayload,
  SellerLegalFiles,
  SellerRegistrationPayload,
} from './authTypes';

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
