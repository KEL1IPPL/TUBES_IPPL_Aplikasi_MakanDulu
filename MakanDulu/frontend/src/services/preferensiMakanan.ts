import { UserPreferences } from '../types';

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
