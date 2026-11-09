import { UserProfile } from '../types';

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
