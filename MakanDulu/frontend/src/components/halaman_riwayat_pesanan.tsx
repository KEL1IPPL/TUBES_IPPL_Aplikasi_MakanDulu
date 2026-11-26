import React, { useState, useEffect, useCallback } from 'react';
import { OrderRecord } from '../types';
import FormUlasan from './form_ulasan';
import apiClient, { RiwayatPesananItem } from '../services/apiClient';

export interface HalamanRiwayatPesananProps {
  orderHistory?: OrderRecord[];
  onReorder?: (order: any) => void;
  onBackToCatalog: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
  onReviewSubmitted?: (rekapRating?: any) => void;
}

const HalamanRiwayatPesanan: React.FC<HalamanRiwayatPesananProps> = ({
  orderHistory = [],
  onReorder,
  onBackToCatalog,
  showToast,
  onReviewSubmitted
}) => {
  const [daftarRiwayat, setDaftarRiwayat] = useState<any[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [filterAktif, setFilterAktif] = useState<'semua' | 'selesai' | 'proses'>('semua');

  // State Modal Formulir Ulasan (Langkah 2 Skenario: Menampilkan formulir pemberian rating dan ulasan)
  const [pesananDiulas, setPesananDiulas] = useState<any | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Ambil data riwayat pesanan dari database (Control Object: pemesanan_controller -> getRiwayatPesanan)
  const muatRiwayatDariDb = useCallback(async () => {
    setSedangMemuat(true);
    try {
      const res = await apiClient.getRiwayatPesanan();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDaftarRiwayat(res.data);
      } else if (orderHistory.length > 0) {
        setDaftarRiwayat(orderHistory);
      }
    } catch (err) {
      console.warn('[HalamanRiwayatPesanan] Gagal memuat dari API, menggunakan data lokal:', err);
      if (orderHistory.length > 0) {
        setDaftarRiwayat(orderHistory);
      }
    } finally {
      setSedangMemuat(false);
    }
  }, [orderHistory]);

  useEffect(() => {
    muatRiwayatDariDb();
  }, [muatRiwayatDariDb]);

  // Handler kirim ulasan (Langkah 3-5 Usecase Pembeli Memberikan Rating dan Ulasan)
  const tanganiKirimUlasan = async (
    rating: number,
    tags: string[],
    comment: string,
    photoUrl?: string
  ) => {
    if (!pesananDiulas) return;

    setIsSubmittingReview(true);
    try {
      // Ambil idPesanan numerik dari pesanan yang dipilih
      const idPesananNumeric =
        typeof pesananDiulas.idPesanan === 'number'
          ? pesananDiulas.idPesanan
          : parseInt(String(pesananDiulas.id || pesananDiulas.orderNumber).replace(/\D/g, ''), 10) || 6;

      // Panggil backend Control Object ulasan_controller: kirimUlasan
      const res = await apiClient.kirimUlasan({
        idPesanan: idPesananNumeric,
        rating,
        komentar: comment,
        tags,
        fotoUlasan: photoUrl,
      });

      // Menampilkan pesan spesifikasi use case: "Terima Kasih Atas Ulasan Anda"
      showToast(
        'Ulasan Terkirim!',
        res.message || 'Terima Kasih Atas Ulasan Anda'
      );

      // Perbarui tampilan riwayat lokal seketika
      setDaftarRiwayat((prev) =>
        prev.map((ord) => {
          const ordIdNum =
            typeof ord.idPesanan === 'number'
              ? ord.idPesanan
              : parseInt(String(ord.id || ord.orderNumber).replace(/\D/g, ''), 10);

          if (ordIdNum === idPesananNumeric) {
            return {
              ...ord,
              review: {
                idUlasan: res.data?.idUlasan || Date.now(),
                rating,
                komentar: comment,
                fotoUlasan: photoUrl,
                tanggalUlasan: new Date().toISOString(),
              },
            };
          }
          return ord;
        })
      );

      // Callback ke parent untuk memperbarui rating katalog
      if (onReviewSubmitted) {
        onReviewSubmitted(res.data?.rekapitulasiRating);
      }

      // Tutup modal formulir ulasan
      setPesananDiulas(null);
    } catch (error: any) {
      console.error('[tanganiKirimUlasan] Gagal:', error);
      showToast(
        'Gagal Mengirim Ulasan',
        error?.message || 'Terjadi kesalahan saat menyimpan ulasan.',
        true
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const pesananTersaring = daftarRiwayat.filter((ord) => {
    const isSelesai = String(ord.status || '').toLowerCase() === 'selesai';
    if (filterAktif === 'selesai') return isSelesai;
    if (filterAktif === 'proses') return !isSelesai;
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 px-4 pb-16">
      {/* Header Halaman Riwayat Pesanan */}
      <div className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdbce] text-[#a33900] flex items-center justify-center font-bold shadow-xs">
            <span className="material-symbols-outlined text-2xl">history</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-[#111c2d]">Riwayat Transaksi & Ulasan</h1>
            <p className="text-xs text-[#5a4138]">
              Daftar pesanan sebelumnya, status transaksi, dan penilaian kuliner
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={muatRiwayatDariDb}
            title="Muat Ulang Riwayat"
            className="p-2 rounded-xl border border-[#dee8ff] text-[#5a4138] hover:bg-[#f0f3ff] transition-colors"
          >
            <span className={`material-symbols-outlined text-lg ${sedangMemuat ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="px-4 py-2 rounded-xl bg-[#a33900] hover:bg-[#cc4900] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">restaurant_menu</span>
            <span>Pesan Lagi</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#dee8ff] pb-2">
        <button
          type="button"
          onClick={() => setFilterAktif('semua')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterAktif === 'semua'
              ? 'bg-[#a33900] text-white shadow-2xs'
              : 'text-[#5a4138] hover:bg-[#dee8ff]'
          }`}
        >
          Semua ({daftarRiwayat.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterAktif('selesai')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterAktif === 'selesai'
              ? 'bg-[#006c49] text-white shadow-2xs'
              : 'text-[#5a4138] hover:bg-[#dee8ff]'
          }`}
        >
          Selesai ({daftarRiwayat.filter((o) => String(o.status || '').toLowerCase() === 'selesai').length})
        </button>
        <button
          type="button"
          onClick={() => setFilterAktif('proses')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            filterAktif === 'proses'
              ? 'bg-[#cc4900] text-white shadow-2xs'
              : 'text-[#5a4138] hover:bg-[#dee8ff]'
          }`}
        >
          Sedang Diproses ({daftarRiwayat.filter((o) => String(o.status || '').toLowerCase() !== 'selesai').length})
        </button>
      </div>

      {/* Daftar Pesanan */}
      {sedangMemuat ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#dee8ff] space-y-3">
          <span className="material-symbols-outlined text-4xl text-[#a33900] animate-spin">
            progress_activity
          </span>
          <p className="text-xs font-bold text-[#5a4138]">Memuat riwayat transaksi dari sistem...</p>
        </div>
      ) : pesananTersaring.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#dee8ff] space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-[#f0f3ff] text-[#5a4138] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <h3 className="text-base font-extrabold text-[#111c2d]">Belum Ada Pesanan pada Kategori Ini</h3>
          <p className="text-xs text-[#5a4138] max-w-sm mx-auto">
            Pesanan yang telah Anda buat akan tercatat di sini lengkap dengan opsi pemberian ulasan dan rating.
          </p>
          <button
            type="button"
            onClick={onBackToCatalog}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#a33900] text-white text-xs font-bold shadow hover:bg-[#cc4900]"
          >
            Mulai Belanja Kuliner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pesananTersaring.map((ord) => {
            const isSelesai = String(ord.status || '').toLowerCase() === 'selesai';
            const sudahDiulas = Boolean(ord.review);

            return (
              <div
                key={ord.id || ord.orderNumber}
                className="bg-white rounded-3xl p-6 border border-[#dee8ff] shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header Kartu Pesanan */}
                <div className="flex items-start sm:items-center justify-between pb-3 border-b border-[#f0f3ff] gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#a33900] block">
                      Pesanan #{ord.orderNumber || `MKD-${ord.idPesanan}`}
                    </span>
                    <span className="text-[11px] text-[#5a4138]">
                      {ord.orderTime || ord.tanggalPemesanan || 'Hari ini'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isSelesai
                          ? 'bg-[#6ffbbe]/30 text-[#004d33]'
                          : String(ord.status || '').toLowerCase() === 'batal' ||
                            String(ord.statusPesananDb || '').toLowerCase().includes('batal')
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : 'bg-[#ffddb8] text-[#825100]'
                      }`}
                    >
                      {isSelesai ? 'Pesanan Selesai' : ord.statusPesananDb || 'Diproses'}
                    </span>
                  </div>
                </div>

                {/* Nama Toko / Resto */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#111c2d]">
                    <span className="material-symbols-outlined text-base text-[#a33900]">storefront</span>
                    <span>{ord.restaurant || ord.items?.[0]?.restaurant || 'Mitra Kuliner'}</span>
                  </div>

                  {/* Daftar Item Menu */}
                  <div className="divide-y divide-[#f9f9ff] bg-[#f9f9ff] rounded-2xl p-3 border border-[#dee8ff]/60">
                    {ord.items && ord.items.map((it: any, idx: number) => (
                      <div key={it.id || idx} className="py-2 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2.5">
                          {it.imageUrl && (
                            <img
                              src={it.imageUrl}
                              alt={it.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#dee8ff]"
                            />
                          )}
                          <div>
                            <span className="font-extrabold text-[#111c2d] block">
                              {it.qty}x {it.name}
                            </span>
                            {it.sublabel && (
                              <span className="text-[10px] text-[#5a4138] italic">
                                {it.sublabel}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-[#111c2d]">
                          Rp {((it.price || 0) * (it.qty || 1)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bagian Ulasan (Jika Sudah Pernah Diulas) */}
                {sudahDiulas && (
                  <div className="p-3.5 bg-[#f0fdf4] rounded-2xl border border-[#bbf7d0] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-500 text-sm font-bold">
                          {'★'.repeat(ord.review.rating)}{'☆'.repeat(5 - ord.review.rating)}
                        </span>
                        <span className="text-xs font-extrabold text-[#14532d]">
                          ({ord.review.rating}/5) Telah Diulas
                        </span>
                      </div>
                      <span className="text-[10px] text-[#166534] font-medium">
                        {ord.review.tanggalUlasan
                          ? new Date(ord.review.tanggalUlasan).toLocaleDateString('id-ID')
                          : 'Baru saja'}
                      </span>
                    </div>

                    <p className="text-xs text-[#166534] italic font-medium">
                      "{ord.review.komentar}"
                    </p>

                    {ord.review.fotoUlasan && (
                      <div className="pt-1">
                        <img
                          src={ord.review.fotoUlasan}
                          alt="Foto Makanan Ulasan"
                          className="w-16 h-16 rounded-xl object-cover border border-[#86efac] shadow-2xs"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Kartu Pesanan: Total & Tombol Aksi */}
                <div className="pt-3 border-t border-[#dee8ff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-[#5a4138] block uppercase tracking-wider font-semibold">
                      Total Tagihan ({ord.paymentMethod?.toUpperCase() || 'MIDTRANS'})
                    </span>
                    <span className="text-base font-black text-[#a33900]">
                      Rp {(ord.total || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* LANGKAH 1 SKENARIO UTAMA: Tombol "Beri Ulasan" untuk pesanan selesai */}
                    {isSelesai && (
                      <button
                        type="button"
                        onClick={() => setPesananDiulas(ord)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          sudahDiulas
                            ? 'bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] border border-[#dee8ff]'
                            : 'bg-[#a33900] hover:bg-[#cc4900] text-white shadow-md animate-pulse'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {sudahDiulas ? 'edit_note' : 'rate_review'}
                        </span>
                        <span>{sudahDiulas ? 'Ubah Ulasan' : 'Beri Ulasan'}</span>
                      </button>
                    )}

                    {onReorder && (
                      <button
                        type="button"
                        onClick={() => onReorder(ord)}
                        className="px-4 py-2 rounded-xl bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#111c2d] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#dee8ff]"
                      >
                        <span className="material-symbols-outlined text-sm">replay</span>
                        <span>Pesan Ulang</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORMULIR PEMBERIAN RATING DAN ULASAN (LANGKAH 2 SKENARIO UTAMA) */}
      {pesananDiulas && (
        <div className="fixed inset-0 z-50 bg-[#111c2d]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dee8ff] max-h-[90vh] overflow-y-auto">
            <FormUlasan
              orderNumber={pesananDiulas.orderNumber || `MKD-${pesananDiulas.idPesanan}`}
              restaurantName={pesananDiulas.restaurant || pesananDiulas.items?.[0]?.restaurant || 'Mitra Kuliner'}
              onSubmitReview={tanganiKirimUlasan}
              onCancel={() => setPesananDiulas(null)}
              isSubmitting={isSubmittingReview}
            />
          </div>
        </div>
      )}
    </div>
  );
};



export default HalamanRiwayatPesanan;
