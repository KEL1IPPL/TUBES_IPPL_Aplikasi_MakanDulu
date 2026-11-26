import {
  CartItem,
  OrderSuccessMeta,
  PaymentMethod,
} from '../types';
import {
  buatPesanan,
  cekStatusPembayaran,
  konfirmasiPembayaranSelesai,
  PesananPayload,
} from '../services/apiClient';

interface JalankanCheckoutParams {
  payload: PesananPayload;
  cart: CartItem[];
  totalPayment: number;
  paymentMethod: PaymentMethod;
  providerLabel: string;
  onOrderSuccess: (
    items: CartItem[],
    total: number,
    paymentMethod: PaymentMethod,
    selectedProvider?: string,
    meta?: OrderSuccessMeta
  ) => void;
  onFinishUi: () => void;
  showToast: (title: string, message: string, isError?: boolean) => void;
}

/**
 * Helper terpadu untuk Checkout & Pembayaran Midtrans Snap (Non-COD vs COD).
 * Memastikan pesanan Non-COD HANYA masuk ke penjual setelah pembayaran selesai.
 */
export const jalankanCheckoutDanPembayaran = async ({
  payload,
  cart,
  totalPayment,
  paymentMethod,
  providerLabel,
  onOrderSuccess,
  onFinishUi,
  showToast,
}: JalankanCheckoutParams): Promise<void> => {
  const response = await buatPesanan(payload);
  const {
    idPesanan,
    orderNumber,
    orderId,
    statusPesanan,
    statusPembayaran,
    batasKonfirmasiAt,
    snapToken,
    redirectUrl,
  } = response.data;

  const formattedOrderNumber = orderNumber || `MKD-${String(idPesanan).padStart(5, '0')}`;

  // Jika metode COD: langsung teruskan ke penjual & masuk halaman status pesanan
  if (paymentMethod === 'cod') {
    onFinishUi();
    onOrderSuccess(cart, totalPayment, paymentMethod, providerLabel, {
      idPesanan,
      orderNumber: formattedOrderNumber,
      statusPesanan: statusPesanan || 'Menunggu Konfirmasi Penjual',
      statusPembayaran: statusPembayaran || 'Belum Dibayar (COD)',
      batasKonfirmasiAt: batasKonfirmasiAt || null,
      catatan: payload.catatan,
    });
    showToast(
      'Pesanan COD Berhasil Dibuat!',
      'Pesanan Anda telah dikirim ke penjual dan menunggu konfirmasi.'
    );
    return;
  }

  // Jika metode Non-COD: buka popup Midtrans Snap
  if (typeof window !== 'undefined' && window.snap && snapToken) {
    window.snap.pay(snapToken, {
      onSuccess: async (result: unknown) => {
        let finalStatusPesanan = 'Menunggu Konfirmasi Penjual';
        let finalBatas = batasKonfirmasiAt || null;
        try {
          const konfRes = await konfirmasiPembayaranSelesai(idPesanan, result);
          if (konfRes?.data) {
            finalStatusPesanan = konfRes.data.statusPesanan || finalStatusPesanan;
            finalBatas = konfRes.data.batasKonfirmasiAt ?? finalBatas;
          }
        } catch (err) {
          console.error('Gagal konfirmasi status pembayaran ke backend:', err);
        }

        onFinishUi();
        onOrderSuccess(cart, totalPayment, paymentMethod, providerLabel, {
          idPesanan,
          orderNumber: formattedOrderNumber,
          midtransOrderId: orderId,
          statusPesanan: finalStatusPesanan,
          statusPembayaran: 'Pembayaran Berhasil',
          batasKonfirmasiAt: finalBatas,
          snapToken,
          catatan: payload.catatan,
        });
        showToast(
          'Pembayaran Berhasil!',
          'Pembayaran terverifikasi. Pesanan Anda telah masuk ke penjual dan menunggu konfirmasi.'
        );
      },

      onPending: () => {
        onFinishUi();
        onOrderSuccess(cart, totalPayment, paymentMethod, providerLabel, {
          idPesanan,
          orderNumber: formattedOrderNumber,
          midtransOrderId: orderId,
          statusPesanan: 'Menunggu Pembayaran',
          statusPembayaran: 'Menunggu Pembayaran',
          snapToken,
          catatan: payload.catatan,
        });
        showToast(
          'Menunggu Pembayaran',
          'Selesaikan pembayaran sesuai instruksi Midtrans agar pesanan segera diteruskan ke penjual.'
        );
      },

      onError: () => {
        onFinishUi();
        showToast(
          'Pembayaran Gagal',
          'Transaksi Midtrans dibatalkan atau gagal diproses. Pesanan tidak dikirim ke penjual.',
          true
        );
      },

      onClose: async () => {
        // Cek apakah pembeli sudah sempat menyelesaikan pembayaran sebelum menutup popup Snap
        try {
          const statusRes = await cekStatusPembayaran(idPesanan);
          const d = statusRes?.data;
          if (d && d.statusPembayaran === 'Pembayaran Berhasil') {
            onFinishUi();
            onOrderSuccess(cart, totalPayment, paymentMethod, providerLabel, {
              idPesanan,
              orderNumber: formattedOrderNumber,
              midtransOrderId: orderId,
              statusPesanan: d.statusPesanan || 'Menunggu Konfirmasi Penjual',
              statusPembayaran: 'Pembayaran Berhasil',
              batasKonfirmasiAt: d.batasKonfirmasiAt || null,
              snapToken,
              catatan: payload.catatan,
            });
            showToast(
              'Pembayaran Berhasil Diverifikasi!',
              'Pesanan Anda telah masuk ke penjual untuk segera dikonfirmasi.'
            );
            return;
          }
        } catch {
          // Abaikan jika status belum tersedia
        }

        onFinishUi();
        onOrderSuccess(cart, totalPayment, paymentMethod, providerLabel, {
          idPesanan,
          orderNumber: formattedOrderNumber,
          midtransOrderId: orderId,
          statusPesanan: 'Menunggu Pembayaran',
          statusPembayaran: 'Menunggu Pembayaran',
          snapToken,
          catatan: payload.catatan,
        });
        showToast(
          'Pembayaran Belum Selesai',
          'Pesanan belum masuk ke penjual. Klik "Lanjutkan Pembayaran" di halaman status pesanan.'
        );
      },
    });
    return;
  }

  if (redirectUrl) {
    onFinishUi();
    window.location.href = redirectUrl;
    return;
  }

  onFinishUi();
  showToast(
    'Pembayaran Midtrans Tidak Tersedia',
    'Token pembayaran gagal dibuat. Silakan coba lagi atau pilih metode COD.',
    true
  );
};
