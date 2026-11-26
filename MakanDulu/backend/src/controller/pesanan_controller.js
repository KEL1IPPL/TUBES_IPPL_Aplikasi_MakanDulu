'use strict';

const db = require('../config/db');
const timerController = require('./timer_controller');
const layananNotifikasi = require('../services/layanan_notifikasi');

/**
 * Control Object: pesanan_controller
 *
 * Mengimplementasikan Diagram Sequence Main Flow & Alternative Flow #1 (Auto Cancel):
 * - konfirmasi_pesanan(idPesanan):
 *   1. Ubah status Pesanan menjadi "Sedang Disiapkan"
 *   2. Panggil timer_controller.stop_timer(idPesanan) -> "timer dihentikan"
 *   3. Panggil layanan_notifikasi -> Kirim notifikasi pembaruan status pesanan ke Penjual (& Pembeli)
 * - autoCancelPesanan(idPesanan) [saat timer_controller mengirim "Waktu habis"]:
 *   1. Ubah status Pesanan menjadi "Dibatalkan Otomatis"
 *   2. Panggil layanan_notifikasi -> Kirim notifikasi pembatalan otomatis ke Pembeli & Penjual
 */

const isMetodeCOD = (metode = '') => {
  const upper = String(metode || '').toUpperCase();
  return !upper.includes('NON-COD') && (upper === 'COD' || upper.startsWith('COD') || upper.includes('TUNAI'));
};

/**
 * Alternative Flow #1: Auto Cancel (dipanggil oleh timer_controller saat waktu 10 menit habis)
 */
const autoCancelPesanan = async (idPesanan) => {
  const id = Number(idPesanan);
  if (!id) return null;

  try {
    const [rows] = await db.execute(
      `SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.statusPesanan,
              b.metodePembayaran, b.statusPembayaran,
              pemb.nama AS namaPembeli,
              penj.namaToko
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       LEFT JOIN Pembeli pemb ON p.idPembeli = pemb.idPembeli
       LEFT JOIN Penjual penj ON p.idPenjual = penj.idPenjual
       WHERE p.idPesanan = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const pesanan = rows[0];

    // Hanya batalkan otomatis jika masih menunggu konfirmasi penjual
    if (pesanan.statusPesanan !== 'Menunggu Konfirmasi Penjual') {
      return { skipped: true, statusPesanan: pesanan.statusPesanan };
    }

    // 1. pesanan_controller -> Pesanan: Mengubah status pesanan menjadi "Dibatalkan Otomatis"
    const [updateRes] = await db.execute(
      `UPDATE Pesanan
       SET statusPesanan = 'Dibatalkan Otomatis'
       WHERE idPesanan = ? AND statusPesanan = 'Menunggu Konfirmasi Penjual'`,
      [id]
    );

    if (updateRes.affectedRows === 0) {
      return { skipped: true };
    }

    const isNonCodPaid =
      !isMetodeCOD(pesanan.metodePembayaran) &&
      pesanan.statusPembayaran === 'Pembayaran Berhasil';

    // 2. pesanan_controller -> layanan_notifikasi:
    //    - Kirim notifikasi pembatalan pesanan secara otomatis ke pembeli
    //    - Kirim notifikasi pembatalan pesanan secara otomatis ke penjual
    await layananNotifikasi.kirimNotifikasiPembatalanOtomatis({
      idPesanan: id,
      idPenjual: pesanan.idPenjual,
      idPembeli: pesanan.idPembeli,
      namaToko: pesanan.namaToko || 'Mitra MakanDulu',
      namaPembeli: pesanan.namaPembeli || 'Pembeli',
      isNonCodPaid,
    });

    console.log(`[pesanan_controller] Pesanan #${id} berhasil dibatalkan secara otomatis.`);
    return {
      success: true,
      idPesanan: id,
      statusPesanan: 'Dibatalkan Otomatis',
    };
  } catch (error) {
    console.error('[pesanan_controller.autoCancelPesanan] Error:', error);
    return null;
  }
};

/**
 * Main Flow: konfirmasi_pesanan(idPesanan)
 * Dipanggil ketika Penjual menekan tombol "Terima Pesanan" di halaman_dashboard_penjual.
 */
const konfirmasi_pesanan = async (req, res) => {
  const idPesanan = Number(req.params.idPesanan || req.body?.idPesanan);

  if (!idPesanan) {
    return res.status(400).json({
      success: false,
      message: 'ID Pesanan wajib disertakan.',
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.statusPesanan, p.totalHarga,
              b.metodePembayaran, b.statusPembayaran,
              penj.namaToko, pemb.nama AS namaPembeli
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       LEFT JOIN Penjual penj ON p.idPenjual = penj.idPenjual
       LEFT JOIN Pembeli pemb ON p.idPembeli = pemb.idPembeli
       WHERE p.idPesanan = ?`,
      [idPesanan]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pesanan tidak ditemukan.',
      });
    }

    const pesanan = rows[0];

    // Validasi kepemilikan jika Penjual login dengan JWT
    if (req.user?.role === 'Penjual' && Number(pesanan.idPenjual) !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk mengonfirmasi pesanan toko lain.',
      });
    }

    // Cek syarat metode pembayaran bukan COD wajib sudah lunas sebelum bisa dikonfirmasi
    const isCod = isMetodeCOD(pesanan.metodePembayaran);
    if (!isCod && pesanan.statusPembayaran !== 'Pembayaran Berhasil') {
      return res.status(400).json({
        success: false,
        message: 'Pesanan non-COD belum menyelesaikan pembayaran dan belum dapat dikonfirmasi.',
      });
    }

    if (pesanan.statusPesanan === 'Dibatalkan Otomatis' || pesanan.statusPesanan === 'Dibatalkan') {
      return res.status(409).json({
        success: false,
        message: 'Pesanan telah dibatalkan secara otomatis karena batas waktu konfirmasi 10 menit berakhir.',
        data: { idPesanan, statusPesanan: pesanan.statusPesanan },
      });
    }

    if (pesanan.statusPesanan === 'Sedang Disiapkan') {
      timerController.stop_timer(idPesanan);
      return res.status(200).json({
        success: true,
        message: 'Pesanan sudah dikonfirmasi dan sedang disiapkan.',
        data: { idPesanan, statusPesanan: 'Sedang Disiapkan', timerStopped: true },
      });
    }

    if (pesanan.statusPesanan !== 'Menunggu Konfirmasi Penjual') {
      return res.status(400).json({
        success: false,
        message: `Pesanan berada di status "${pesanan.statusPesanan}" dan tidak menunggu konfirmasi.`,
      });
    }

    // 1. pesanan_controller -> Pesanan: Mengubah status pesanan menjadi "Sedang Disiapkan"
    await db.execute(
      `UPDATE Pesanan
       SET statusPesanan = 'Sedang Disiapkan',
           dikonfirmasiAt = NOW()
       WHERE idPesanan = ?`,
      [idPesanan]
    );

    // 2. pesanan_controller -> timer_controller: stop_timer(idPesanan) -> "timer dihentikan"
    const timerResult = timerController.stop_timer(idPesanan);

    // 3. pesanan_controller -> layanan_notifikasi: Kirim notifikasi pembaruan status pesanan
    const notifikasi = await layananNotifikasi.kirimNotifikasiPembaruanStatus({
      idPesanan,
      idPenjual: pesanan.idPenjual,
      idPembeli: pesanan.idPembeli,
      namaToko: pesanan.namaToko || 'Mitra MakanDulu',
      statusBaru: 'Sedang Disiapkan',
    });

    return res.status(200).json({
      success: true,
      message: 'Pesanan berhasil dikonfirmasi! Status diperbarui menjadi "Sedang Disiapkan".',
      data: {
        idPesanan,
        orderNumber: `MKD-${String(idPesanan).padStart(5, '0')}`,
        statusPesanan: 'Sedang Disiapkan',
        timerStopped: timerResult.stopped,
        timerMessage: timerResult.message,
        notifikasi,
      },
    });
  } catch (error) {
    console.error('[pesanan_controller.konfirmasi_pesanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengonfirmasi pesanan: ' + error.message,
    });
  }
};

/**
 * Ambil daftar pesanan masuk Penjual:
 * Hanya menampilkan pesanan COD atau pesanan Non-COD yang pembayarannya SUDAH BERHASIL ("Pembayaran Berhasil").
 */
const getPesananPenjual = async (req, res) => {
  const idPenjual = req.user?.role === 'Penjual' ? req.user.id : req.query.idPenjual;

  if (!idPenjual) {
    return res.status(403).json({
      success: false,
      message: 'Identitas Penjual diperlukan untuk mengambil daftar pesanan.',
    });
  }

  try {
    // Sinkronkan terlebih dahulu pesanan yang waktunya sudah lewat 10 menit (lazy check)
    const [expiredRows] = await db.execute(
      `SELECT p.idPesanan
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       WHERE p.idPenjual = ?
         AND p.statusPesanan = 'Menunggu Konfirmasi Penjual'
         AND p.batasKonfirmasiAt IS NOT NULL
         AND p.batasKonfirmasiAt <= NOW()
         AND (
           (UPPER(COALESCE(b.metodePembayaran, '')) NOT LIKE '%NON-COD%' AND UPPER(COALESCE(b.metodePembayaran, '')) LIKE '%COD%')
           OR b.statusPembayaran = 'Pembayaran Berhasil'
         )`,
      [idPenjual]
    );

    for (const exp of expiredRows) {
      await autoCancelPesanan(exp.idPesanan);
    }

    const [pesananRows] = await db.execute(
      `SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.tanggalPemesanan, p.alamatPengantaran,
              p.catatan, p.statusPesanan, p.batasKonfirmasiAt,
              GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, NOW(), p.batasKonfirmasiAt), 0)) AS sisaDetikDb,
              p.dikonfirmasiAt, p.totalHarga, p.totalDiskon,
              b.metodePembayaran, b.statusPembayaran, b.totalBayar, b.tanggalPembayaran,
              pemb.nama AS namaPembeli, pemb.nomorTelepon AS teleponPembeli
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       LEFT JOIN Pembeli pemb ON p.idPembeli = pemb.idPembeli
       WHERE p.idPenjual = ?
         AND p.statusPesanan <> 'Menunggu Pembayaran'
         AND (
           (UPPER(COALESCE(b.metodePembayaran, '')) NOT LIKE '%NON-COD%' AND UPPER(COALESCE(b.metodePembayaran, '')) LIKE '%COD%')
           OR b.statusPembayaran = 'Pembayaran Berhasil'
         )
       ORDER BY p.idPesanan DESC`,
      [idPenjual]
    );

    if (pesananRows.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const ids = pesananRows.map((r) => r.idPesanan);
    const placeholders = ids.map(() => '?').join(',');
    const [itemRows] = await db.execute(
      `SELECT dp.idDetailPesanan, dp.idPesanan, dp.idMenu, dp.jumlah, dp.hargaSatuan, dp.subtotal,
              m.namaMenu, m.modifier
       FROM DetailPesanan dp
       JOIN Menu m ON dp.idMenu = m.idMenu
       WHERE dp.idPesanan IN (${placeholders})`,
      ids
    );

    const itemsByPesanan = {};
    for (const it of itemRows) {
      if (!itemsByPesanan[it.idPesanan]) itemsByPesanan[it.idPesanan] = [];
      itemsByPesanan[it.idPesanan].push({
        idMenu: it.idMenu,
        name: it.namaMenu,
        qty: it.jumlah,
        modifier: it.modifier || 'Reguler',
        price: Number(it.hargaSatuan),
        subtotal: Number(it.subtotal),
      });
    }

    const mapped = pesananRows.map((p) => {
      const isCod = isMetodeCOD(p.metodePembayaran);
      const remainingSeconds =
        p.statusPesanan === 'Menunggu Konfirmasi Penjual'
          ? timerController.getSisaDetik(p.idPesanan, p.sisaDetikDb)
          : 0;
      const batasIsoUtc =
        p.statusPesanan === 'Menunggu Konfirmasi Penjual' && p.batasKonfirmasiAt
          ? new Date(Date.now() + remainingSeconds * 1000).toISOString()
          : null;

      return {
        id: `ord-${p.idPesanan}`,
        idPesanan: p.idPesanan,
        orderNumber: `MKD-${String(p.idPesanan).padStart(5, '0')}`,
        customerName: p.namaPembeli || 'Pelanggan MakanDulu',
        customerPhone: p.teleponPembeli || '-',
        customerAddress: p.alamatPengantaran || '',
        catatan: p.catatan || '',
        items: itemsByPesanan[p.idPesanan] || [],
        totalPrice: Number(p.totalHarga),
        discount: Number(p.totalDiskon || 0),
        remainingSeconds,
        batasKonfirmasiAt: batasIsoUtc,
        statusPesanan: p.statusPesanan,
        metodePembayaran: p.metodePembayaran || 'Midtrans',
        statusPembayaran: p.statusPembayaran || 'Menunggu Pembayaran',
        paymentType: isCod
          ? 'COD (Bayar Tunai di Tempat)'
          : `${p.metodePembayaran || 'Non-COD'} (Lunas)`,
        isCOD: isCod,
        orderTime: p.tanggalPemesanan
          ? new Date(p.tanggalPemesanan).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }) + ' WIB'
          : '',
        tanggalPemesanan: p.tanggalPemesanan,
      };
    });

    return res.status(200).json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error('[pesanan_controller.getPesananPenjual] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar pesanan penjual: ' + error.message,
    });
  }
};

/**
 * Penjual menandai makanan selesai dimasak dan siap diantar kurir ("Pesanan Diantar")
 */
const tandaiPesananDiantar = async (req, res) => {
  const idPesanan = Number(req.params.idPesanan);

  try {
    const [rows] = await db.execute(
      `SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.statusPesanan, penj.namaToko
       FROM Pesanan p
       LEFT JOIN Penjual penj ON p.idPenjual = penj.idPenjual
       WHERE p.idPesanan = ?`,
      [idPesanan]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const pesanan = rows[0];
    if (req.user?.role === 'Penjual' && Number(pesanan.idPenjual) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    }

    await db.execute(
      `UPDATE Pesanan SET statusPesanan = 'Pesanan Diantar' WHERE idPesanan = ?`,
      [idPesanan]
    );

    await layananNotifikasi.kirimNotifikasiPembaruanStatus({
      idPesanan,
      idPenjual: pesanan.idPenjual,
      idPembeli: pesanan.idPembeli,
      namaToko: pesanan.namaToko || 'Mitra MakanDulu',
      statusBaru: 'Pesanan Diantar',
    });

    return res.status(200).json({
      success: true,
      message: 'Makanan siap! Status pesanan diperbarui menjadi "Pesanan Diantar".',
      data: { idPesanan, statusPesanan: 'Pesanan Diantar' },
    });
  } catch (error) {
    console.error('[pesanan_controller.tandaiPesananDiantar] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status pengantaran.' });
  }
};

/**
 * Pembeli mengonfirmasi pesanan telah diterima ("Pesanan Selesai") atau menolak COD ("Dibatalkan")
 */
const selesaikanPesananPembeli = async (req, res) => {
  const idPesanan = Number(req.params.idPesanan);
  const { ditolakCod = false } = req.body || {};

  try {
    const [rows] = await db.execute(
      `SELECT idPesanan, idPembeli, idPenjual, statusPesanan FROM Pesanan WHERE idPesanan = ?`,
      [idPesanan]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const statusBaru = ditolakCod ? 'Dibatalkan' : 'Pesanan Selesai';
    await db.execute(`UPDATE Pesanan SET statusPesanan = ? WHERE idPesanan = ?`, [
      statusBaru,
      idPesanan,
    ]);

    return res.status(200).json({
      success: true,
      message: ditolakCod ? 'Pesanan COD ditolak.' : 'Pesanan telah selesai diterima.',
      data: { idPesanan, statusPesanan: statusBaru },
    });
  } catch (error) {
    console.error('[pesanan_controller.selesaikanPesananPembeli] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status pesanan.' });
  }
};

/**
 * Simulasi waktu 10 menit habis untuk menguji Alternative Flow #1 Auto Cancel
 */
const simulasiWaktuHabis = async (req, res) => {
  const idPesanan = Number(req.params.idPesanan);
  try {
    const hasil = await timerController.triggerWaktuHabis(idPesanan);
    if (!hasil || hasil.skipped) {
      return res.status(400).json({
        success: false,
        message: 'Pesanan tidak berada dalam status Menunggu Konfirmasi Penjual.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Simulasi waktu habis dijalankan. Pesanan dibatalkan secara otomatis.',
      data: hasil,
    });
  } catch (error) {
    console.error('[pesanan_controller.simulasiWaktuHabis] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menjalankan simulasi auto-cancel.' });
  }
};

/**
 * Ambil pesanan aktif terbaru milik Pembeli (untuk sinkronisasi Halaman Status Pesanan Pembeli saat reload/login)
 */
const getPesananAktifPembeli = async (req, res) => {
  const idPembeli = req.user?.role === 'Pembeli' ? req.user.id : req.query.idPembeli;
  if (!idPembeli) {
    return res.status(200).json({ success: true, data: null });
  }

  try {
    const [rows] = await db.execute(
      `SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.tanggalPemesanan, p.alamatPengantaran,
              p.catatan, p.statusPesanan, p.batasKonfirmasiAt,
              TIMESTAMPDIFF(SECOND, NOW(), p.batasKonfirmasiAt) AS sisaDetikDb,
              p.dikonfirmasiAt, p.totalHarga, p.totalDiskon,
              b.metodePembayaran, b.statusPembayaran, b.midtransOrderId,
              penj.namaToko, penj.alamatToko
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       LEFT JOIN Penjual penj ON p.idPenjual = penj.idPenjual
       WHERE p.idPembeli = ?
         AND (
           p.statusPesanan IN ('Menunggu Pembayaran', 'Menunggu Konfirmasi Penjual', 'Pesanan Diterima oleh Penjual', 'Sedang Disiapkan', 'Pesanan Disiapkan', 'Pesanan Diantar')
           OR (p.statusPesanan = 'Dibatalkan Otomatis' AND p.tanggalPemesanan >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
         )
       ORDER BY p.idPesanan DESC
       LIMIT 1`,
      [idPembeli]
    );

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    const p = rows[0];
    // Lazy auto-cancel jika sudah lewat deadline (berdasarkan jam MySQL)
    if (
      p.statusPesanan === 'Menunggu Konfirmasi Penjual' &&
      p.batasKonfirmasiAt &&
      Number(p.sisaDetikDb ?? 0) <= 0
    ) {
      await autoCancelPesanan(p.idPesanan);
      p.statusPesanan = 'Dibatalkan Otomatis';
    }

    const [items] = await db.execute(
      `SELECT dp.idDetailPesanan, dp.idMenu, dp.jumlah, dp.hargaSatuan, dp.subtotal,
              m.namaMenu, m.modifier, COALESCE(m.fotoUrl, m.foto) AS fotoUrl
       FROM DetailPesanan dp
       JOIN Menu m ON dp.idMenu = m.idMenu
       WHERE dp.idPesanan = ?`,
      [p.idPesanan]
    );

    const remainingSeconds =
      p.statusPesanan === 'Menunggu Konfirmasi Penjual'
        ? timerController.getSisaDetik(p.idPesanan, Math.max(0, Number(p.sisaDetikDb ?? 0)))
        : 0;
    const batasIsoUtc =
      p.statusPesanan === 'Menunggu Konfirmasi Penjual' && p.batasKonfirmasiAt
        ? new Date(Date.now() + remainingSeconds * 1000).toISOString()
        : null;

    return res.status(200).json({
      success: true,
      data: {
        ...p,
        batasKonfirmasiAt: batasIsoUtc,
        orderNumber: `MKD-${String(p.idPesanan).padStart(5, '0')}`,
        remainingSeconds,
        items,
      },
    });
  } catch (error) {
    console.error('[pesanan_controller.getPesananAktifPembeli] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memuat pesanan aktif pembeli.' });
  }
};

module.exports = {
  konfirmasi_pesanan,
  autoCancelPesanan,
  getPesananPenjual,
  tandaiPesananDiantar,
  selesaikanPesananPembeli,
  simulasiWaktuHabis,
  getPesananAktifPembeli,
};
