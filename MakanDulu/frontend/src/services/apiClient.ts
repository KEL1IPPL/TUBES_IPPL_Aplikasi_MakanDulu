import { UserProfile, UserPreferences, MenuItem, StoreProfile } from '../types';

export interface KatalogResponse {
  success: boolean;
  message?: string;
  data: {
    menus: MenuItem[];
    rekomendasi: MenuItem[];
    tokoList: StoreProfile[];
    preferensi: {
      rasaFavorit: string[];
      kategoriFavorit: string[];
      polaMakan: string[];
    };
  };
}

export interface SearchKatalogResponse {
  success: boolean;
  ditemukan: boolean;
  kataKunci: string;
  totalHasil?: number;
  message?: string;
  data: MenuItem[];
  rekomendasiAlternatif?: MenuItem[];
  preferensi?: {
    rasaFavorit: string[];
    kategoriFavorit: string[];
    polaMakan: string[];
  };
}

export interface MenuPayload {
  namaMenu: string;
  kategori: string;
  harga: number;
  hargaNormal?: number;
  deskripsi?: string;
  fotoUrl?: string;
  rasaKarakter?: string[];
  modifier?: string;
  statusAktif?: boolean;
}

export interface MenuApiItem {
  id: string;
  idMenu?: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  description: string;
  imageUrl: string;
  tasteCategory: string[];
  modifier?: string;
  isAvailable: boolean;
  restaurant: string;
  distance: string;
  rating: number;
  reviewCount: string;
  tag: string;
  salesCount: string;
  createdAt?: string;
}

export interface MenuResponse {
  success: boolean;
  message: string;
  data: MenuApiItem;
}

export interface MenuListResponse {
  success: boolean;
  message?: string;
  data: MenuApiItem[];
}

export interface LegalitasOcrResponse {
  success: boolean;
  message: string;
  data: {
    nik: string;
    npwp: string;
    nib: string;
  };
  hasilParsial?: {
    nik: string | null;
    npwp: string | null;
    nib: string | null;
  };
}

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
  responseBody?: unknown;

  constructor(message: string, status: number, responseBody?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

const getMenuToken = (): string => {
  const token = localStorage.getItem('makandulu_token');
  if (!token) {
    throw new ApiError('Sesi pengguna tidak ditemukan. Silakan login kembali.', 401);
  }
  return token;
};

const menuRequest = async <TResponse>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload?: unknown
): Promise<TResponse> => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${getMenuToken()}`,
  };
  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  const data = await response.json() as TResponse & {
    success?: boolean;
    message?: string;
  };

  if (!response.ok || data.success === false) {
    throw new ApiError(
      data.message || 'Permintaan menu ke server gagal.',
      response.status,
      data
    );
  }
  return data;
};

export const getMenus = () =>
  menuRequest<MenuListResponse>('/api/menu', 'GET');

export const tambahMenu = (payload: MenuPayload) =>
  menuRequest<MenuResponse>('/api/menu', 'POST', payload);

export const updateMenu = (idMenu: number, payload: MenuPayload) =>
  menuRequest<MenuResponse>(`/api/menu/${idMenu}`, 'PUT', payload);

export const toggleMenuStatus = (idMenu: number) =>
  menuRequest<MenuResponse>(`/api/menu/${idMenu}/stok`, 'PATCH');

export const hapusMenu = (idMenu: number) =>
  menuRequest<MenuResponse>(`/api/menu/${idMenu}`, 'DELETE');

export const getProfilPengguna = async (): Promise<AuthResponse> => {
  const token = localStorage.getItem('makandulu_token');
  if (!token) {
    throw new ApiError('Token tidak ditemukan.', 401);
  }
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = (await response.json()) as AuthResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal memuat profil pengguna.', response.status);
  }
  return data;
};

export const getKatalog = async (idPembeli?: number | string): Promise<KatalogResponse> => {
  const token = localStorage.getItem('makandulu_token');
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const query = idPembeli ? `?idPembeli=${idPembeli}` : '';
  const response = await fetch(`/api/katalog${query}`, { headers });
  const data = (await response.json()) as KatalogResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal memuat katalog.', response.status, data);
  }
  return data;
};

export const searchKatalog = async (
  query: string,
  kategori?: string,
  idPembeli?: number | string
): Promise<SearchKatalogResponse> => {
  const token = localStorage.getItem('makandulu_token');
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (kategori && kategori !== 'all') params.append('kategori', kategori);
  if (idPembeli) params.append('idPembeli', String(idPembeli));

  const response = await fetch(`/api/katalog/search?${params.toString()}`, { headers });
  const data = (await response.json()) as SearchKatalogResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal mencari menu.', response.status, data);
  }
  return data;
};

export const getDetailMenuKatalog = async (idMenu: number): Promise<MenuResponse> => {
  const response = await fetch(`/api/katalog/menu/${idMenu}`);
  const data = (await response.json()) as MenuResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal memuat detail menu.', response.status, data);
  }
  return data;
};

export const getDaftarTokoKatalog = async (): Promise<{ success: boolean; data: StoreProfile[] }> => {
  const response = await fetch('/api/katalog/toko');
  const data = (await response.json()) as { success: boolean; data: StoreProfile[] };
  if (!response.ok || data.success === false) {
    throw new ApiError('Gagal memuat daftar toko.', response.status, data);
  }
  return data;
};

const apiClient = {
  getMenus,
  tambahMenu,
  updateMenu,
  toggleMenuStatus,
  hapusMenu,
  toggleStokMenu: toggleMenuStatus,
  getProfil: getProfilPengguna,
  getKatalog,
  searchKatalog,
  getDetailMenuKatalog,
  getDaftarTokoKatalog,
};

export default apiClient;

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

export const bacaDokumenLegalitas = async (
  ktpFile: File,
  npwpFile: File,
  nibFile: File
): Promise<LegalitasOcrResponse> => {
  const formData = new FormData();
  formData.append('ktpFile', ktpFile);
  formData.append('npwpFile', npwpFile);
  formData.append('nibFile', nibFile);

  const response = await fetch('/api/dokumen/baca/legalitas', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json() as LegalitasOcrResponse;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Gagal membaca dokumen legalitas.');
  }
  return data;
};

