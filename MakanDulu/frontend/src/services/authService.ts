import { UserProfile } from '../types';
import { postJson } from './apiClient';

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

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserProfile & { id: number };
}

const requestAuth = (
  endpoint: string,
  payload: LoginPayload | BuyerRegistrationPayload | SellerRegistrationPayload
): Promise<AuthResponse> => postJson<AuthResponse, typeof payload>(
  `/api/auth/${endpoint}`,
  payload
);

export const login = (payload: LoginPayload) =>
  requestAuth('login', payload);

export const registerPembeli = (payload: BuyerRegistrationPayload) =>
  requestAuth('register/pembeli', payload);

export const registerPenjual = (payload: SellerRegistrationPayload) =>
  requestAuth('register/penjual', payload);
