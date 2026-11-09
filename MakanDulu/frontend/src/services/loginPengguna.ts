import { postJson } from './apiClient';
import { AuthResponse, LoginPayload } from './authTypes';

export const login = (payload: LoginPayload) =>
  postJson<AuthResponse, LoginPayload>('/api/auth/login', payload);
