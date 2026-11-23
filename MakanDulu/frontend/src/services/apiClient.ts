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

export const safeParseJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      throw new ApiError(
        'Server backend belum aktif atau tidak dapat dijangkau di port 3001. Pastikan server backend sudah dijalankan (jalankan "npm run dev" di folder backend).',
        response.status
      );
    }
    throw new ApiError(
      `Respon dari server bukan JSON yang valid (${response.status}).`,
      response.status
    );
  }
};

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
  const data = (await safeParseJson(response)) as TResponse & {
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

export const toggleMenuStatus = (idMenu: number, statusAktif?: boolean) =>
  menuRequest<MenuResponse>(
    `/api/menu/${idMenu}/stok`,
    'PATCH',
    statusAktif !== undefined ? { statusAktif } : undefined
  );

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
  const data = (await safeParseJson(response)) as AuthResponse;
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
  const data = (await safeParseJson(response)) as KatalogResponse;
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
  const data = (await safeParseJson(response)) as SearchKatalogResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal mencari menu.', response.status, data);
  }
  return data;
};

export const getDetailMenuKatalog = async (idMenu: number): Promise<MenuResponse> => {
  const response = await fetch(`/api/katalog/menu/${idMenu}`);
  const data = (await safeParseJson(response)) as MenuResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal memuat detail menu.', response.status, data);
  }
  return data;
};

export const getDaftarTokoKatalog = async (): Promise<{ success: boolean; data: StoreProfile[] }> => {
  const response = await fetch('/api/katalog/toko');
  const data = (await safeParseJson(response)) as { success: boolean; data: StoreProfile[] };
  if (!response.ok || data.success === false) {
    throw new ApiError('Gagal memuat daftar toko.', response.status, data);
  }
  return data;
};

export interface MasukanItemKeranjangResponse {
  success: boolean;
  message: string;
  data?: {
    idKeranjang: number;
    idItemKeranjang: number;
    idMenu: number;
    namaMenu: string;
    hargaSatuan: number;
    jumlah: number;
    totalHarga: number;
  };
}

/**
 * Flow 3 Sequence Diagram:
 * halaman_detail_menu -> katalog_controller: masukan item ke keranjang
 * Response: tampilkan pesan "Menu telah ditambahkan ke keranjang"
 */
export const masukanItemKeKeranjang = async (
  idMenu: number | string,
  jumlah: number = 1,
  idPembeli?: number | string
): Promise<MasukanItemKeranjangResponse> => {
  const token = localStorage.getItem('makandulu_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const numericId =
    typeof idMenu === 'number'
      ? idMenu
      : parseInt(String(idMenu).replace(/\D/g, ''), 10) || idMenu;

  const response = await fetch('/api/katalog/keranjang', {
    method: 'POST',
    headers,
    body: JSON.stringify({ idMenu: numericId, jumlah, idPembeli }),
  });

  const data = (await safeParseJson(response)) as MasukanItemKeranjangResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal memasukkan menu ke keranjang.', response.status, data);
  }
  return data;
};

export interface CartDbItem {
  id: string;
  idItemKeranjang: number;
  idMenu: number;
  name: string;
  price: number;
  qty: number;
  subtotal: number;
  imageUrl?: string;
  restaurant?: string;
  isAvailable?: boolean;
}

export interface CartDbResponse {
  success: boolean;
  message?: string;
  data: {
    idKeranjang: number;
    idPembeli: number;
    totalHarga: number;
    items: CartDbItem[];
  };
}

export const getKeranjang = async (idPembeli?: number | string): Promise<CartDbResponse> => {
  const token = localStorage.getItem('makandulu_token');
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const query = idPembeli ? `?idPembeli=${idPembeli}` : '';
  const response = await fetch(`/api/keranjang${query}`, { headers });
  const data = (await safeParseJson(response)) as CartDbResponse;
  if (!response.ok || data.success === false) {
    throw new ApiError(data.message || 'Gagal memuat keranjang.', response.status, data);
  }
  return data;
};

export const hapusItemKeranjang = async (idItemKeranjang: number | string) => {
  const token = localStorage.getItem('makandulu_token');
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`/api/keranjang/item/${idItemKeranjang}`, {
    method: 'DELETE',
    headers,
  });
  return safeParseJson(response);
};

export const kosongkanKeranjang = async () => {
  const token = localStorage.getItem('makandulu_token');
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch('/api/keranjang', {
    method: 'DELETE',
    headers,
  });
  return safeParseJson(response);
};

export const lewatiPreferensiMakanan = async (): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('makandulu_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('/api/halaman-preferensi-makanan/lewati', {
    method: 'POST',
    headers,
  });
  return safeParseJson(response);
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
  const data = (await safeParseJson(response)) as PreferenceResponse;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Gagal menyimpan preferensi makanan.');
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
  masukanItemKeKeranjang,
  getKeranjang,
  hapusItemKeranjang,
  kosongkanKeranjang,
  simpanPreferensiMakanan,
  lewatiPreferensiMakanan,
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

  const data = (await safeParseJson(response)) as TResponse & {
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
    const data = (await safeParseJson(response)) as AuthResponse;
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
  const data = (await safeParseJson(response)) as LegalitasOcrResponse;

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'Gagal membaca dokumen legalitas.');
  }
  return data;
};

// =============================================================================
// PEMESANAN & LAYANAN PEMBAYARAN MIDTRANS (SEQUENCE DIAGRAM PEMBAYARAN)
// =============================================================================

export interface PesananItemPayload {
  idMenu?: number | string;
  menuId?: number | string;
  id?: number | string;
  name: string;
  price: number;
  qty: number;
}

export interface PesananPayload {
  idPembeli?: number;
  idPenjual?: number;
  items: PesananItemPayload[];
  alamatPengantaran: string;
  kodeVoucher?: string;
  metodePembayaran: string;
  ongkir?: number;
  catatan?: string;
}

export interface PesananData {
  idPesanan: number;
  idPembayaran: number;
  orderId: string;
  totalBayar: number;
  totalHargaItem: number;
  totalDiskon: number;
  biayaOngkir: number;
  metodePembayaran: string;
  statusPesanan: string;
  statusPembayaran: string;
  snapToken?: string;
  redirectUrl?: string;
}

export interface PesananResponse {
  success: boolean;
  message: string;
  data: PesananData;
}

export const buatPesanan = (payload: PesananPayload) =>
  postJson<PesananResponse, PesananPayload>('/api/pemesanan', payload);

export const konfirmasiPembayaranSelesai = (
  idPesanan: number,
  midtransResult?: unknown
) =>
  postJson<
    { success: boolean; message: string; data: unknown },
    { midtransResult?: unknown }
  >(`/api/pembayaran/selesai/${idPesanan}`, { midtransResult });

export const getStatusPesanan = async (idPesanan: number) => {
  const response = await fetch(`/api/pemesanan/${idPesanan}`);
  const data = await safeParseJson<{ success: boolean; data: any }>(response);
  if (!response.ok || data.success === false) {
    throw new ApiError('Gagal memuat status pesanan.', response.status, data);
  }
  return data;
};


