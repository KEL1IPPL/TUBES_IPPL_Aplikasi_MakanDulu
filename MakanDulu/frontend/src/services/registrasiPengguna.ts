import { postJson } from './apiClient';
import {
  AuthResponse,
  BuyerRegistrationPayload,
  SellerRegistrationPayload,
} from './authTypes';

const requestRegistration = <TPayload>(
  endpoint: string,
  payload: TPayload
): Promise<AuthResponse> =>
  postJson<AuthResponse, TPayload>(`/api/auth/register/${endpoint}`, payload);

export const registerPembeli = (payload: BuyerRegistrationPayload) =>
  requestRegistration('pembeli', payload);

export const registerPenjual = (payload: SellerRegistrationPayload) =>
  requestRegistration('penjual', payload);
