/**
 * Utilitas Penyimpanan Lokal (LocalStorage) untuk MakanDulu Food Ecosystem
 * Menjaga data keranjang, menu, preferensi, riwayat pesanan, dan saldo tetap tersimpan saat refresh.
 */

export const KUNCI_STORAGE = {
  MENU: 'makandulu_daftar_menu',
  KERANJANG: 'makandulu_keranjang',
  ALAMAT: 'makandulu_alamat',
  PESANAN_AKTIF: 'makandulu_pesanan_aktif',
  PROFIL: 'makandulu_profil_pengguna',
  STATUS_TOKO: 'makandulu_status_toko_buka',
  TAHAP_APLIKASI: 'makandulu_tahap_aplikasi',
  PERAN: 'makandulu_peran_pengguna',
  RIWAYAT_PESANAN: 'makandulu_riwayat_pesanan'
} as const;

/**
 * Memuat data dari localStorage dengan nilai bawaan (fallback)
 */
export function muatDariPenyimpanan<T>(kunci: string, nilaiBawaan: T): T {
  if (typeof window === 'undefined') return nilaiBawaan;
  try {
    const item = window.localStorage.getItem(kunci);
    if (!item) return nilaiBawaan;
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`[PenyimpananLokal] Gagal membaca kunci "${kunci}":`, error);
    return nilaiBawaan;
  }
}

/**
 * Menyimpan data ke localStorage
 */
export function simpanKePenyimpanan<T>(kunci: string, nilai: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
  } catch (error) {
    console.warn(`[PenyimpananLokal] Gagal menyimpan kunci "${kunci}":`, error);
  }
}

/**
 * Menghapus data spesifik dari localStorage
 */
export function hapusDariPenyimpanan(kunci: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(kunci);
  } catch (error) {
    console.warn(`[PenyimpananLokal] Gagal menghapus kunci "${kunci}":`, error);
  }
}

/**
 * Mereset semua data MakanDulu ke kondisi awal
 */
export function resetSemuaPenyimpanan(): void {
  if (typeof window === 'undefined') return;
  Object.values(KUNCI_STORAGE).forEach((kunci) => {
    try {
      window.localStorage.removeItem(kunci);
    } catch {
      // Abaikan error saat reset
    }
  });
}
