'use strict';

const db = require('../config/db');

/**
 * External Service Object: layanan_notifikasi (:eksternal)
 *
 * Mengimplementasikan pengiriman notifikasi pada Diagram Sequence:
 * 1. Pesanan baru masuk setelah pembayaran Non-COD selesai (atau COD) -> Penjual
 * 2. Main Flow: Kirim notifikasi pembaruan status pesanan ("Sedang Disiapkan") -> Penjual & Pembeli
 * 3. Alternative Flow #1 Auto Cancel:
 *    - Kirim notifikasi pembatalan pesanan secara otomatis ke pembeli -> Pembeli
 *    - Kirim notifikasi pembatalan pesanan secara otomatis ke penjual -> Penjual
 */

const formatOrderNumber = (idPesanan) => `MKD-${String(idPesanan).padStart(5, '0')}`;

const simpanNotifikasi = async ({
  penerimaRole,
  idPenerima,
  idPesanan = null,
  judul,
  pesan,
  tipe = 'info',
}) => {
  if (!idPenerima) return null;

  try {
    const [result] = await db.execute(
      `INSERT INTO Notifikasi (penerimaRole, idPenerima, idPesanan, judul, pesan, tipe, sudahDibaca, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [penerimaRole, Number(idPenerima), idPesanan ? Number(idPesanan) : null, judul, pesan, tipe]
    );
    console.log(`[layanan_notifikasi] Terkirim ke ${penerimaRole}#${idPenerima}: ${judul}`);
    return {
      idNotifikasi: result.insertId,
      penerimaRole,
      idPenerima: Number(idPenerima),
      idPesanan,
      judul,
      pesan,
      tipe,
    };
  } catch (err) {
    console.error('[layanan_notifikasi] Gagal menyimpan notifikasi:', err.message);
    return null;
  }
};

/**
 * Notifikasi pesanan baru masuk ke Penjual (hanya dipanggil setelah pembayaran Non-COD lunas, atau COD)
 */
const kirimNotifikasiPesananMasuk = async ({
  idPesanan,
  idPenjual,
  namaPembeli = 'Pembeli',
  totalHarga = 0,
  metodePembayaran = 'Midtrans',
  isLunas = true,
}) => {
  const orderNumber = formatOrderNumber(idPesanan);
  const statusBayarLabel = isLunas ? `Lunas (${metodePembayaran})` : `COD (${metodePembayaran})`;
  return await simpanNotifikasi({
    penerimaRole: 'Penjual',
    idPenerima: idPenjual,
    idPesanan,
    judul: `Pesanan Baru Masuk #${orderNumber}`,
    pesan: `${namaPembeli} memesan hidangan senilai Rp ${Number(totalHarga).toLocaleString('id-ID')} [${statusBayarLabel}]. Segera klik "Terima Pesanan" sebelum batas waktu 10 menit berakhir.`,
    tipe: 'pesanan_baru',
  });
};

/**
 * Main Flow Langkah 7-8:
 * pesanan_controller -> layanan_notifikasi: Kirim notifikasi pembaruan status pesanan
 * layanan_notifikasi --> Penjual (& Pembeli): mengirim notifikasi pembaruan status pesanan
 */
const kirimNotifikasiPembaruanStatus = async ({
  idPesanan,
  idPenjual,
  idPembeli,
  namaToko = 'Resto Mitra',
  statusBaru = 'Sedang Disiapkan',
}) => {
  const orderNumber = formatOrderNumber(idPesanan);

  const notifPenjual = await simpanNotifikasi({
    penerimaRole: 'Penjual',
    idPenerima: idPenjual,
    idPesanan,
    judul: `Status Pesanan #${orderNumber} Diperbarui`,
    pesan: `Konfirmasi berhasil. Status pesanan #${orderNumber} telah diperbarui menjadi "${statusBaru}" dan timer 10 menit telah dihentikan.`,
    tipe: 'status_diperbarui',
  });

  const notifPembeli = await simpanNotifikasi({
    penerimaRole: 'Pembeli',
    idPenerima: idPembeli,
    idPesanan,
    judul: `Pesanan #${orderNumber} ${statusBaru}`,
    pesan: `${namaToko} telah menerima pesanan Anda! Status pesanan saat ini: "${statusBaru}".`,
    tipe: 'status_diperbarui',
  });

  return { notifPenjual, notifPembeli };
};

/**
 * Alternative Flow #1 Auto Cancel:
 * - Kirim notifikasi pembatalan pesanan secara otomatis ke pembeli
 * - Kirim notifikasi pembatalan pesanan secara otomatis ke penjual
 */
const kirimNotifikasiPembatalanOtomatis = async ({
  idPesanan,
  idPenjual,
  idPembeli,
  namaToko = 'Resto Mitra',
  namaPembeli = 'Pembeli',
  isNonCodPaid = false,
}) => {
  const orderNumber = formatOrderNumber(idPesanan);

  const catatanRefund = isNonCodPaid
    ? ' Dana pembayaran Anda akan dikembalikan secara otomatis.'
    : '';

  const notifPembeli = await simpanNotifikasi({
    penerimaRole: 'Pembeli',
    idPenerima: idPembeli,
    idPesanan,
    judul: `Pesanan #${orderNumber} Dibatalkan Otomatis`,
    pesan: `Pesanan Anda ke ${namaToko} dibatalkan secara otomatis karena batas waktu konfirmasi penjual (10 menit) telah habis.${catatanRefund}`,
    tipe: 'auto_cancel',
  });

  const notifPenjual = await simpanNotifikasi({
    penerimaRole: 'Penjual',
    idPenerima: idPenjual,
    idPesanan,
    judul: `Pesanan #${orderNumber} Dibatalkan Otomatis`,
    pesan: `Pesanan #${orderNumber} atas nama ${namaPembeli} dibatalkan secara otomatis oleh sistem karena waktu tunggu konfirmasi 10 menit telah habis.`,
    tipe: 'auto_cancel',
  });

  return { notifPembeli, notifPenjual };
};

const ambilNotifikasi = async ({ role, idUser, limit = 25 }) => {
  if (!role || !idUser) return [];
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 25));
  const [rows] = await db.execute(
    `SELECT idNotifikasi, penerimaRole, idPenerima, idPesanan, judul, pesan, tipe, sudahDibaca, createdAt
     FROM Notifikasi
     WHERE penerimaRole = ? AND idPenerima = ?
     ORDER BY idNotifikasi DESC
     LIMIT ${safeLimit}`,
    [role, Number(idUser)]
  );
  return rows.map((r) => ({
    ...r,
    sudahDibaca: Boolean(r.sudahDibaca),
  }));
};

const tandaiNotifikasiDibaca = async ({ role, idUser, idNotifikasi = null }) => {
  if (!role || !idUser) return;
  if (idNotifikasi) {
    await db.execute(
      `UPDATE Notifikasi SET sudahDibaca = 1 WHERE idNotifikasi = ? AND penerimaRole = ? AND idPenerima = ?`,
      [Number(idNotifikasi), role, Number(idUser)]
    );
  } else {
    await db.execute(
      `UPDATE Notifikasi SET sudahDibaca = 1 WHERE penerimaRole = ? AND idPenerima = ? AND sudahDibaca = 0`,
      [role, Number(idUser)]
    );
  }
};

module.exports = {
  simpanNotifikasi,
  kirimNotifikasiPesananMasuk,
  kirimNotifikasiPembaruanStatus,
  kirimNotifikasiPembatalanOtomatis,
  ambilNotifikasi,
  tandaiNotifikasiDibaca,
};
