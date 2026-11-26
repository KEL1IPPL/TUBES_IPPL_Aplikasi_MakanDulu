'use strict';

const db = require('../config/db');
const { buatTransaksiSnap, cekStatusTransaksi } = require('../services/layanan_midtrans');
const timerController = require('./timer_controller');
const layananNotifikasi = require('../services/layanan_notifikasi');
const { autoCancelPesanan } = require('./pesanan_controller');

const isMetodeCOD = (metode = '') => {
  const upper = String(metode || '').toUpperCase();
  return !upper.includes('NON-COD') && (upper === 'COD' || upper.startsWith('COD') || upper.includes('TUNAI') || upper.includes('BAYAR DI TEMPAT'));
};

/**
 * Helper idempoten untuk meneruskan pesanan Non-COD ke Penjual SETELAH pembayaran berhasil.
 * Mengubah status -> "Menunggu Konfirmasi Penjual", mulai timer 10 menit, dan kirim notifikasi ke Penjual.
 */
const aktifkanPesananSetelahPembayaran = async (idPesanan) => {
  const id = Number(idPesanan);
  const [rows] = await db.execute(
    `SELECT p.idPesanan, p.idPenjual, p.idPembeli, p.statusPesanan, p.batasKonfirmasiAt, p.totalHarga,
            b.metodePembayaran, b.statusPembayaran,
            pemb.nama AS namaPembeli
     FROM Pesanan p
     LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
     LEFT JOIN Pembeli pemb ON p.idPembeli = pemb.idPembeli
     WHERE p.idPesanan = ?`,
    [id]
  );

  if (rows.length === 0) return null;
  const pesanan = rows[0];

  await db.execute(
    `UPDATE Pembayaran
     SET statusPembayaran = 'Pembayaran Berhasil', tanggalPembayaran = NOW()
     WHERE idPesanan = ?`,
    [id]
  );

  // Hanya teruskan ke Penjual jika sebelumnya masih menunggu pembayaran (mencegah duplikasi timer/notif)
  if (pesanan.statusPesanan === 'Menunggu Pembayaran') {
    await db.execute(
      `UPDATE Pesanan
       SET statusPesanan = 'Menunggu Konfirmasi Penjual',
           batasKonfirmasiAt = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
       WHERE idPesanan = ?`,
      [id]
    );

    timerController.start_timer(id, timerController.DURASI_KONFIRMASI_MS);

    await layananNotifikasi.kirimNotifikasiPesananMasuk({
      idPesanan: id,
      idPenjual: pesanan.idPenjual,
      namaPembeli: pesanan.namaPembeli || 'Pembeli',
      totalHarga: Number(pesanan.totalHarga),
      metodePembayaran: pesanan.metodePembayaran || 'Midtrans',
      isLunas: true,
    });
  } else if (pesanan.statusPesanan === 'Menunggu Konfirmasi Penjual' && !pesanan.batasKonfirmasiAt) {
    await db.execute(
      `UPDATE Pesanan
       SET batasKonfirmasiAt = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
       WHERE idPesanan = ?`,
      [id]
    );
    timerController.start_timer(id, timerController.DURASI_KONFIRMASI_MS);
  }

  const [updated] = await db.execute(
    `SELECT statusPesanan,
            GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, NOW(), batasKonfirmasiAt), 0)) AS sisaDetikDb
     FROM Pesanan WHERE idPesanan = ?`,
    [id]
  );
  const row = updated[0];
  const sisa = Number(row?.sisaDetikDb ?? 600);
  return {
    statusPesanan: row?.statusPesanan || 'Menunggu Konfirmasi Penjual',
    batasKonfirmasiAt: new Date(Date.now() + sisa * 1000).toISOString(),
  };
};

// 1. BUAT PESANAN (Checkout & Inisialisasi Pembayaran Midtrans)
const buatPesanan = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const idPembeliToken = req.user?.id;
    const {
      idPembeli: idPembeliBody,
      idPenjual: idPenjualBody,
      items = [],
      alamatPengantaran,
      kodeVoucher,
      metodePembayaran = 'Midtrans',
      ongkir = 10000,
      catatan,
    } = req.body;

    const idPembeli = idPembeliToken || idPembeliBody || 1;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keranjang belanja kosong. Pilih minimal satu menu.',
      });
    }

    if (!alamatPengantaran || !String(alamatPengantaran).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Alamat pengantaran wajib diisi.',
      });
    }

    // Ambil data Pembeli (nama, email, no hp) untuk rincian Midtrans
    const [pembeliRows] = await connection.execute(
      'SELECT idPembeli, nama, email, nomorTelepon, alamat FROM Pembeli WHERE idPembeli = ?',
      [idPembeli]
    );
    const pembeli = pembeliRows[0] || {
      idPembeli,
      nama: req.user?.nama || 'Pembeli MakanDulu',
      email: req.user?.email || 'pembeli@makandulu.id',
      nomorTelepon: '081234567890',
      alamat: alamatPengantaran,
    };

    // Ambil semua idMenu dari items
    const menuIds = items.map((it) => {
      const rawId = it.idMenu || it.menuId || it.id;
      return typeof rawId === 'string' ? Number(rawId.replace(/\D/g, '')) : Number(rawId);
    }).filter(Boolean);

    if (menuIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Menu yang dipilih tidak valid.',
      });
    }

    // --- LANGKAH 11 & 12: Cek Stok Menu (Entity Menu) ---
    const placeholders = menuIds.map(() => '?').join(',');
    const [menuRows] = await connection.execute(
      `SELECT idMenu, idPenjual, namaMenu, harga, stok, statusAktif FROM Menu WHERE idMenu IN (${placeholders})`,
      menuIds
    );

    const menuMap = new Map();
    menuRows.forEach((m) => menuMap.set(m.idMenu, m));

    // Periksa apakah ada menu yang berstatus nonaktif (stok habis)
    for (const it of items) {
      const mId = typeof it.idMenu === 'number' ? it.idMenu : Number(String(it.idMenu || it.menuId || it.id).replace(/\D/g, ''));
      const menuDb = menuMap.get(mId);

      if (!menuDb) {
        return res.status(404).json({
          success: false,
          message: `Menu dengan ID ${mId} tidak ditemukan di sistem.`,
        });
      }

      if (menuDb.statusAktif === 0 || menuDb.statusAktif === false || Number(menuDb.stok ?? 10) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Menu "${menuDb.namaMenu}" sedang habis stoknya (nonaktif). Hapus menu ini dari pesanan sebelum melanjutkan.`,
        });
      }
    }

    // Tentukan idPenjual dari hidangan yang dipesan
    const idPenjual = idPenjualBody || menuRows[0]?.idPenjual || 1;

    // Hitung subtotal item dari harga resmi database
    let totalHargaItem = 0;
    const detailItems = items.map((it) => {
      const mId = typeof it.idMenu === 'number' ? it.idMenu : Number(String(it.idMenu || it.menuId || it.id).replace(/\D/g, ''));
      const menuDb = menuMap.get(mId);
      const qty = Math.max(1, Number(it.qty || it.jumlah || 1));
      const hargaSatuan = Number(menuDb.harga);
      const subtotal = hargaSatuan * qty;
      totalHargaItem += subtotal;

      return {
        idMenu: mId,
        namaMenu: menuDb.namaMenu,
        jumlah: qty,
        hargaSatuan,
        subtotal,
      };
    });

    // --- LANGKAH 13 & 14: Validasi Voucher (Entity Voucher) ---
    let idVoucher = null;
    let totalDiskon = 0;
    let kodeVoucherAktif = null;

    if (kodeVoucher && String(kodeVoucher).trim()) {
      const [voucherRows] = await connection.execute(
        `SELECT idVoucher, idPenjual, kodeVoucher, jenisDiskon, nilaiDiskon, kuota, tanggalBerakhir 
         FROM Voucher 
         WHERE kodeVoucher = ? AND tanggalBerakhir >= NOW()`,
        [String(kodeVoucher).trim().toUpperCase()]
      );

      if (voucherRows.length > 0 && voucherRows[0].kuota > 0) {
        const v = voucherRows[0];
        idVoucher = v.idVoucher;
        kodeVoucherAktif = v.kodeVoucher;

        if (v.jenisDiskon === 'Persentase') {
          totalDiskon = Math.round((totalHargaItem * Number(v.nilaiDiskon)) / 100);
        } else {
          totalDiskon = Number(v.nilaiDiskon);
        }

        // Diskon tidak boleh melebihi total belanja item
        totalDiskon = Math.min(totalDiskon, totalHargaItem);

        // Kurangi kuota voucher 1
        await connection.execute(
          'UPDATE Voucher SET kuota = GREATEST(0, kuota - 1) WHERE idVoucher = ?',
          [v.idVoucher]
        );
      }
    }

    // Total akhir yang harus dibayar pembeli (Item - Diskon + Ongkir)
    const biayaOngkir = Number(ongkir) || 0;
    const totalBayar = Math.max(0, totalHargaItem - totalDiskon + biayaOngkir);

    // Tentukan status awal berdasarkan metode pembayaran:
    // - COD -> langsung "Menunggu Konfirmasi Penjual" + timer 10 menit
    // - Non-COD (Midtrans) -> "Menunggu Pembayaran" (belum masuk ke penjual sampai pembayaran lunas!)
    const isCOD = isMetodeCOD(metodePembayaran);
    const statusAwalPesanan = isCOD ? 'Menunggu Konfirmasi Penjual' : 'Menunggu Pembayaran';
    const statusAwalPembayaran = isCOD ? 'Belum Dibayar (COD)' : 'Menunggu Pembayaran';

    // Mulai transaksi database
    await connection.beginTransaction();

    // --- LANGKAH 15 & 16: Simpan Pesanan (Entity Pesanan) ---
    const [pesananResult] = await connection.execute(
      `INSERT INTO Pesanan 
        (idPembeli, idPenjual, idVoucher, tanggalPemesanan, kodeVoucher, alamatPengantaran, catatan, statusPesanan, batasKonfirmasiAt, totalHarga, totalDiskon) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ${isCOD ? 'DATE_ADD(NOW(), INTERVAL 10 MINUTE)' : 'NULL'}, ?, ?)`,
      [
        idPembeli,
        idPenjual,
        idVoucher,
        kodeVoucherAktif,
        String(alamatPengantaran).trim(),
        catatan ? String(catatan).trim() : null,
        statusAwalPesanan,
        totalBayar,
        totalDiskon,
      ]
    );

    const idPesanan = pesananResult.insertId;
    const orderId = `MD-${idPesanan}-${Date.now().toString().slice(-6)}`;

    // --- LANGKAH 17–20: Simpan Detail Pesanan dari Keranjang (Entity DetailPesanan) ---
    for (const d of detailItems) {
      await connection.execute(
        `INSERT INTO DetailPesanan 
          (idPesanan, idMenu, jumlah, hargaSatuan, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [idPesanan, d.idMenu, d.jumlah, d.hargaSatuan, d.subtotal]
      );
    }

    // --- LANGKAH 21 & 22: Simpan Data Pembayaran (Entity Pembayaran) ---
    const [pembayaranResult] = await connection.execute(
      `INSERT INTO Pembayaran 
        (idPesanan, midtransOrderId, metodePembayaran, statusPembayaran, totalBayar, tanggalPembayaran) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [idPesanan, isCOD ? null : orderId, metodePembayaran, statusAwalPembayaran, totalBayar]
    );

    const idPembayaran = pembayaranResult.insertId;

    // --- LANGKAH 23 & 24: Hapus Data Keranjang (Entity Keranjang & ItemKeranjang) ---
    try {
      await connection.execute(
        `DELETE ik FROM ItemKeranjang ik 
         JOIN Keranjang k ON ik.idKeranjang = k.idKeranjang 
         WHERE k.idPembeli = ?`,
        [idPembeli]
      );
      await connection.execute(
        'UPDATE Keranjang SET totalHarga = 0 WHERE idPembeli = ?',
        [idPembeli]
      );
    } catch (cartErr) {
      // Abaikan jika keranjang local belum pernah disinkronkan ke DB
      console.warn('[buatPesanan] Keranjang DB tidak ditemukan/sudah kosong:', cartErr.message);
    }

    // Commit transaksi pesanan ke database
    await connection.commit();

    // Jika COD: langsung mulai timer 10 menit dan beri tahu penjual
    let batasKonfirmasiAt = null;
    if (isCOD) {
      const [batasRows] = await db.execute(
        `SELECT GREATEST(0, COALESCE(TIMESTAMPDIFF(SECOND, NOW(), batasKonfirmasiAt), 600)) AS sisaDetikDb
         FROM Pesanan WHERE idPesanan = ?`,
        [idPesanan]
      );
      const sisaDetik = Number(batasRows[0]?.sisaDetikDb ?? 600);
      batasKonfirmasiAt = new Date(Date.now() + sisaDetik * 1000).toISOString();
      timerController.start_timer(idPesanan, timerController.DURASI_KONFIRMASI_MS);
      await layananNotifikasi.kirimNotifikasiPesananMasuk({
        idPesanan,
        idPenjual,
        namaPembeli: pembeli.nama,
        totalHarga: totalBayar,
        metodePembayaran,
        isLunas: false,
      });
    }

    // --- LANGKAH 25 & 26: Proses Pembayaran via Layanan Midtrans [eksternal] ---
    let snapToken = null;
    let redirectUrl = null;

    if (!isCOD) {
      try {
        const itemSnapDetails = detailItems.map((item) => ({
          id: `MENU-${item.idMenu}`,
          price: Math.round(item.hargaSatuan),
          quantity: item.jumlah,
          name: item.namaMenu,
        }));

        if (totalDiskon > 0) {
          itemSnapDetails.push({
            id: 'DISKON-VOUCHER',
            price: -Math.round(totalDiskon),
            quantity: 1,
            name: `Potongan Voucher (${kodeVoucherAktif || 'Diskon'})`,
          });
        }

        if (biayaOngkir > 0) {
          itemSnapDetails.push({
            id: 'ONGKIR',
            price: Math.round(biayaOngkir),
            quantity: 1,
            name: 'Ongkos Kirim MakanDulu',
          });
        }

        const sumItems = itemSnapDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const midtransGross = sumItems > 0 ? sumItems : Math.round(totalBayar);

        const midtransRes = await buatTransaksiSnap({
          orderId,
          grossAmount: midtransGross,
          itemDetails: itemSnapDetails,
          customerDetails: {
            nama: pembeli.nama,
            email: pembeli.email,
            nomorTelepon: pembeli.nomorTelepon,
            alamat: alamatPengantaran,
          },
        });

        snapToken = midtransRes.token;
        redirectUrl = midtransRes.redirect_url;
      } catch (midtransError) {
        console.error('[buatPesanan] Gagal inisialisasi Midtrans Snap:', midtransError.message);
      }
    }

    // --- LANGKAH 27: Menampilkan Halaman Pembayaran ---
    return res.status(201).json({
      success: true,
      message: isCOD
        ? 'Pesanan COD berhasil dibuat dan diteruskan ke penjual.'
        : 'Pesanan berhasil dibuat. Silakan selesaikan pembayaran via Midtrans agar pesanan diteruskan ke penjual.',
      data: {
        idPesanan,
        orderNumber: `MKD-${String(idPesanan).padStart(5, '0')}`,
        idPembayaran,
        orderId,
        totalBayar,
        totalHargaItem,
        totalDiskon,
        biayaOngkir,
        metodePembayaran,
        statusPesanan: statusAwalPesanan,
        statusPembayaran: statusAwalPembayaran,
        batasKonfirmasiAt,
        snapToken,
        redirectUrl,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('[PemesananController.buatPesanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat membuat pesanan: ' + error.message,
    });
  } finally {
    connection.release();
  }
};

// 2. WEBHOOK NOTIFIKASI MIDTRANS (LANGKAH 29–34)
const notifikasiMidtrans = async (req, res) => {
  try {
    const notif = req.body;
    console.log('[Midtrans Webhook] Menerima notifikasi:', notif);

    const orderId = notif.order_id;
    const transactionStatus = notif.transaction_status;
    const fraudStatus = notif.fraud_status;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'order_id tidak ditemukan.' });
    }

    // Ambil idPesanan dari orderId (misal: "MD-12-123456" -> 12)
    const match = orderId.match(/^MD-(\d+)/);
    const idPesanan = match ? Number(match[1]) : null;

    if (!idPesanan) {
      return res.status(400).json({ success: false, message: 'Format order_id tidak valid.' });
    }

    let statusBaruPembayaran = null;
    let statusBaruPesanan = null;

    if ((transactionStatus === 'capture' && fraudStatus === 'accept') || transactionStatus === 'settlement') {
      // --- LANGKAH 30–34: Pembayaran Non-COD Berhasil -> teruskan ke penjual & mulai timer 10 menit ---
      const aktif = await aktifkanPesananSetelahPembayaran(idPesanan);
      statusBaruPembayaran = 'Pembayaran Berhasil';
      statusBaruPesanan = aktif?.statusPesanan || 'Menunggu Konfirmasi Penjual';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      statusBaruPembayaran = transactionStatus === 'expire' ? 'Kadaluarsa' : 'Pembayaran Dibatalkan';
      statusBaruPesanan = 'Dibatalkan';
      await db.execute(
        `UPDATE Pembayaran SET statusPembayaran = ?, tanggalPembayaran = NOW() WHERE idPesanan = ?`,
        [statusBaruPembayaran, idPesanan]
      );
      await db.execute(
        `UPDATE Pesanan SET statusPesanan = 'Dibatalkan' WHERE idPesanan = ?`,
        [idPesanan]
      );
    } else if (transactionStatus === 'pending') {
      statusBaruPembayaran = 'Menunggu Pembayaran';
      await db.execute(
        `UPDATE Pembayaran SET statusPembayaran = ? WHERE idPesanan = ?`,
        [statusBaruPembayaran, idPesanan]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Status pembayaran berhasil disinkronkan dari Midtrans.',
      data: { idPesanan, statusBaruPembayaran, statusBaruPesanan },
    });
  } catch (error) {
    console.error('[PemesananController.notifikasiMidtrans] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses webhook Midtrans: ' + error.message,
    });
  }
};

// 3. KONFIRMASI STATUS PEMBAYARAN SUKSES DARI FRONTEND (LANGKAH 30–35)
const konfirmasiPembayaranSelesai = async (req, res) => {
  const { idPesanan } = req.params;

  try {
    const [rows] = await db.execute(
      'SELECT idPesanan, statusPesanan FROM Pesanan WHERE idPesanan = ?',
      [idPesanan]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    // --- LANGKAH 31–34: Ubah Status Pembayaran -> "Pembayaran Berhasil", Pesanan -> "Menunggu Konfirmasi Penjual", mulai timer & notif penjual ---
    const aktif = await aktifkanPesananSetelahPembayaran(idPesanan);

    return res.status(200).json({
      success: true,
      message: 'Pembayaran berhasil diverifikasi. Pesanan diteruskan ke penjual.',
      data: {
        idPesanan: Number(idPesanan),
        orderNumber: `MKD-${String(idPesanan).padStart(5, '0')}`,
        statusPembayaran: 'Pembayaran Berhasil',
        statusPesanan: aktif?.statusPesanan || 'Menunggu Konfirmasi Penjual',
        batasKonfirmasiAt: aktif?.batasKonfirmasiAt || null,
      },
    });
  } catch (error) {
    console.error('[PemesananController.konfirmasiPembayaranSelesai] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status pembayaran: ' + error.message,
    });
  }
};

// 4. CEK STATUS PESANAN & PEMBAYARAN (Sekaligus Sinkron Midtrans jika masih Menunggu Pembayaran)
const getStatusPesanan = async (req, res) => {
  const { idPesanan } = req.params;

  try {
    const querySql = `
      SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.tanggalPemesanan, p.alamatPengantaran,
             p.catatan, p.statusPesanan, p.batasKonfirmasiAt,
             TIMESTAMPDIFF(SECOND, NOW(), p.batasKonfirmasiAt) AS sisaDetikDb,
             p.dikonfirmasiAt, p.totalHarga, p.totalDiskon, p.kodeVoucher,
             b.idPembayaran, b.midtransOrderId, b.metodePembayaran, b.statusPembayaran, b.totalBayar, b.tanggalPembayaran,
             penj.namaToko, penj.alamatToko
      FROM Pesanan p
      LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
      LEFT JOIN Penjual penj ON p.idPenjual = penj.idPenjual
      WHERE p.idPesanan = ?`;

    let [rows] = await db.execute(querySql, [idPesanan]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    let pesanan = rows[0];

    // Jika Non-COD masih "Menunggu Pembayaran", cek status riil ke Midtrans API
    if (
      pesanan.statusPesanan === 'Menunggu Pembayaran' &&
      pesanan.statusPembayaran === 'Menunggu Pembayaran' &&
      pesanan.midtransOrderId
    ) {
      try {
        const tx = await cekStatusTransaksi(pesanan.midtransOrderId);
        const txStatus = tx?.transaction_status;
        const fraud = tx?.fraud_status;
        if (txStatus === 'settlement' || (txStatus === 'capture' && fraud === 'accept')) {
          await aktifkanPesananSetelahPembayaran(idPesanan);
          [rows] = await db.execute(querySql, [idPesanan]);
          pesanan = rows[0];
        } else if (['cancel', 'deny', 'expire'].includes(txStatus)) {
          const stBayar = txStatus === 'expire' ? 'Kadaluarsa' : 'Pembayaran Dibatalkan';
          await db.execute(
            `UPDATE Pembayaran SET statusPembayaran = ? WHERE idPesanan = ?`,
            [stBayar, idPesanan]
          );
          await db.execute(
            `UPDATE Pesanan SET statusPesanan = 'Dibatalkan' WHERE idPesanan = ?`,
            [idPesanan]
          );
          [rows] = await db.execute(querySql, [idPesanan]);
          pesanan = rows[0];
        }
      } catch {
        // Midtrans belum memiliki record pembayaran (pembeli belum memilih channel di Snap), abaikan
      }
    }

    // Jika sedang "Menunggu Konfirmasi Penjual" tapi timer 10 menit sudah habis -> jalankan Auto Cancel
    if (
      pesanan.statusPesanan === 'Menunggu Konfirmasi Penjual' &&
      pesanan.batasKonfirmasiAt &&
      Number(pesanan.sisaDetikDb ?? 0) <= 0
    ) {
      await autoCancelPesanan(idPesanan);
      [rows] = await db.execute(querySql, [idPesanan]);
      pesanan = rows[0];
    }

    const [items] = await db.execute(
      `SELECT dp.idDetailPesanan, dp.idMenu, dp.jumlah, dp.hargaSatuan, dp.subtotal,
              m.namaMenu, COALESCE(m.fotoUrl, m.foto) AS fotoUrl
       FROM DetailPesanan dp
       JOIN Menu m ON dp.idMenu = m.idMenu
       WHERE dp.idPesanan = ?`,
      [idPesanan]
    );

    const remainingSeconds =
      pesanan.statusPesanan === 'Menunggu Konfirmasi Penjual'
        ? timerController.getSisaDetik(pesanan.idPesanan, Math.max(0, Number(pesanan.sisaDetikDb ?? 0)))
        : 0;
    const batasIsoUtc =
      pesanan.statusPesanan === 'Menunggu Konfirmasi Penjual' && pesanan.batasKonfirmasiAt
        ? new Date(Date.now() + remainingSeconds * 1000).toISOString()
        : null;

    return res.status(200).json({
      success: true,
      data: {
        ...pesanan,
        batasKonfirmasiAt: batasIsoUtc,
        orderNumber: `MKD-${String(pesanan.idPesanan).padStart(5, '0')}`,
        remainingSeconds,
        items,
      },
    });
  } catch (error) {
    console.error('[PemesananController.getStatusPesanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil status pesanan.',
    });
  }
};

// 5. AMBIL RIWAYAT PESANAN PEMBELI (Untuk Halaman Riwayat & Ulasan)
const getRiwayatPesanan = async (req, res) => {
  const idPembeliToken = req.user?.id;
  const idPembeliQuery = req.query.idPembeli;
  const idPembeli = idPembeliToken || idPembeliQuery || 1;

  try {
    const [pesananRows] = await db.execute(
      `SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.tanggalPemesanan, p.alamatPengantaran,
              p.statusPesanan, p.totalHarga, p.totalDiskon, p.kodeVoucher,
              b.idPembayaran, b.metodePembayaran, b.statusPembayaran, b.totalBayar,
              penj.namaToko, penj.alamatToko,
              u.idUlasan, u.rating, u.komentar, u.fotoUlasan, u.tanggalUlasan
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       LEFT JOIN Penjual penj ON p.idPenjual = penj.idPenjual
       LEFT JOIN Ulasan u ON p.idPesanan = u.idPesanan
       WHERE p.idPembeli = ?
       ORDER BY p.idPesanan DESC`,
      [idPembeli]
    );

    if (pesananRows.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const idPesananList = pesananRows.map((p) => p.idPesanan);
    const placeholders = idPesananList.map(() => '?').join(',');

    const [itemRows] = await db.execute(
      `SELECT dp.idDetailPesanan, dp.idPesanan, dp.idMenu, dp.jumlah, dp.hargaSatuan, dp.subtotal,
              m.namaMenu, COALESCE(m.fotoUrl, m.foto) AS fotoUrl, m.kategori
       FROM DetailPesanan dp
       JOIN Menu m ON dp.idMenu = m.idMenu
       WHERE dp.idPesanan IN (${placeholders})`,
      idPesananList
    );

    const itemsByPesanan = {};
    for (const item of itemRows) {
      if (!itemsByPesanan[item.idPesanan]) {
        itemsByPesanan[item.idPesanan] = [];
      }
      itemsByPesanan[item.idPesanan].push({
        id: `c-${item.idDetailPesanan}`,
        menuId: `menu-${item.idMenu}`,
        idMenu: item.idMenu,
        name: item.namaMenu,
        price: Number(item.hargaSatuan),
        qty: item.jumlah,
        subtotal: Number(item.subtotal),
        imageUrl: item.fotoUrl,
        category: item.kategori,
      });
    }

    const formattedOrders = pesananRows.map((p) => {
      const items = itemsByPesanan[p.idPesanan] || [];
      const statusRaw = String(p.statusPesanan || '').toLowerCase();
      let statusMapped = 'dimasak';
      if (statusRaw.includes('selesai')) statusMapped = 'selesai';
      else if (statusRaw.includes('antar')) statusMapped = 'diantar';
      else if (statusRaw.includes('siap') || statusRaw.includes('terima')) statusMapped = 'dimasak';
      else if (statusRaw.includes('batal')) statusMapped = 'batal';

      return {
        id: `ord-${p.idPesanan}`,
        idPesanan: p.idPesanan,
        orderNumber: `MKD-${String(p.idPesanan).padStart(5, '0')}`,
        orderTime: p.tanggalPemesanan
          ? new Date(p.tanggalPemesanan).toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })
          : '',
        tanggalPemesanan: p.tanggalPemesanan,
        status: statusMapped,
        statusPesananDb: p.statusPesanan,
        restaurant: p.namaToko || 'Mitra MakanDulu',
        restaurantAddress: p.alamatToko || '',
        idPenjual: p.idPenjual,
        items: items.map((it) => ({
          ...it,
          restaurant: p.namaToko || 'Mitra MakanDulu',
        })),
        subtotal: Math.max(0, Number(p.totalHarga) + Number(p.totalDiskon || 0) - 12000),
        shippingFee: 10000,
        serviceFee: 2000,
        discount: Number(p.totalDiskon || 0),
        total: Number(p.totalHarga),
        paymentMethod: (p.metodePembayaran || 'Midtrans').toLowerCase(),
        statusPembayaran: p.statusPembayaran || 'Belum Dibayar',
        address: {
          label: 'Alamat Pengantaran',
          street: p.alamatPengantaran || 'Alamat tujuan',
          details: '',
        },
        review: p.idUlasan
          ? {
              idUlasan: p.idUlasan,
              rating: p.rating,
              komentar: p.komentar,
              fotoUlasan: p.fotoUlasan,
              tanggalUlasan: p.tanggalUlasan,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error('[PemesananController.getRiwayatPesanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat pesanan: ' + error.message,
    });
  }
};

module.exports = {
  buatPesanan,
  notifikasiMidtrans,
  konfirmasiPembayaranSelesai,
  getStatusPesanan,
  getRiwayatPesanan,
};
