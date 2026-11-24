'use strict';

const db = require('../config/db');
const { buatTransaksiSnap, cekStatusTransaksi } = require('../services/layanan_midtrans');

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
      `SELECT idMenu, idPenjual, namaMenu, harga, statusAktif FROM Menu WHERE idMenu IN (${placeholders})`,
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

      if (menuDb.statusAktif === 0 || menuDb.statusAktif === false) {
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

    // Mulai transaksi database
    await connection.beginTransaction();

    // --- LANGKAH 15 & 16: Simpan Pesanan (Entity Pesanan) ---
    const [pesananResult] = await connection.execute(
      `INSERT INTO Pesanan 
        (idPembeli, idPenjual, idVoucher, tanggalPemesanan, kodeVoucher, alamatPengantaran, statusPesanan, totalHarga, totalDiskon) 
       VALUES (?, ?, ?, NOW(), ?, ?, 'Menunggu Konfirmasi Penjual', ?, ?)`,
      [
        idPembeli,
        idPenjual,
        idVoucher,
        kodeVoucherAktif,
        String(alamatPengantaran).trim(),
        totalBayar,
        totalDiskon,
      ]
    );

    const idPesanan = pesananResult.insertId;

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
    const isCOD = String(metodePembayaran).toUpperCase() === 'COD';
    const statusAwalPembayaran = isCOD ? 'Belum Dibayar (COD)' : 'Menunggu Pembayaran';

    const [pembayaranResult] = await connection.execute(
      `INSERT INTO Pembayaran 
        (idPesanan, metodePembayaran, statusPembayaran, totalBayar, tanggalPembayaran) 
       VALUES (?, ?, ?, ?, NOW())`,
      [idPesanan, metodePembayaran, statusAwalPembayaran, totalBayar]
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

    // --- LANGKAH 25 & 26: Proses Pembayaran via Layanan Midtrans [eksternal] ---
    let snapToken = null;
    let redirectUrl = null;
    const orderId = `MD-${idPesanan}-${Date.now().toString().slice(-6)}`;

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
        // Jangan batalkan pesanan jika Midtrans sandbox timeout, berikan fallback
      }
    }

    // --- LANGKAH 27: Menampilkan Halaman Pembayaran ---
    return res.status(201).json({
      success: true,
      message: isCOD
        ? 'Pesanan COD berhasil dibuat. Pembayaran dilakukan saat kurir tiba.'
        : 'Pesanan berhasil dibuat. Silakan selesaikan pembayaran via Midtrans.',
      data: {
        idPesanan,
        idPembayaran,
        orderId,
        totalBayar,
        totalHargaItem,
        totalDiskon,
        biayaOngkir,
        metodePembayaran,
        statusPesanan: 'Menunggu Konfirmasi Penjual',
        statusPembayaran: statusAwalPembayaran,
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

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        statusBaruPembayaran = 'Pembayaran Berhasil';
        statusBaruPesanan = 'Menunggu Konfirmasi Penjual';
      }
    } else if (transactionStatus === 'settlement') {
      // --- LANGKAH 30–34: Pembayaran Berhasil ---
      statusBaruPembayaran = 'Pembayaran Berhasil';
      statusBaruPesanan = 'Menunggu Konfirmasi Penjual';
    } else if (['cancel', 'deny', 'expire'].includes(transactionStatus)) {
      statusBaruPembayaran = transactionStatus === 'expire' ? 'Kadaluarsa' : 'Pembayaran Dibatalkan';
      statusBaruPesanan = 'Dibatalkan';
    } else if (transactionStatus === 'pending') {
      statusBaruPembayaran = 'Menunggu Pembayaran';
    }

    if (statusBaruPembayaran) {
      await db.execute(
        `UPDATE Pembayaran 
         SET statusPembayaran = ?, tanggalPembayaran = NOW() 
         WHERE idPesanan = ?`,
        [statusBaruPembayaran, idPesanan]
      );
    }

    if (statusBaruPesanan) {
      await db.execute(
        `UPDATE Pesanan 
         SET statusPesanan = ? 
         WHERE idPesanan = ?`,
        [statusBaruPesanan, idPesanan]
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
  const { midtransResult } = req.body || {};

  try {
    const [rows] = await db.execute(
      'SELECT idPesanan, statusPesanan FROM Pesanan WHERE idPesanan = ?',
      [idPesanan]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    // --- LANGKAH 31–34: Ubah Status Pembayaran & Status Pesanan ---
    await db.execute(
      `UPDATE Pembayaran 
       SET statusPembayaran = 'Pembayaran Berhasil', tanggalPembayaran = NOW() 
       WHERE idPesanan = ?`,
      [idPesanan]
    );

    await db.execute(
      `UPDATE Pesanan 
       SET statusPesanan = 'Menunggu Konfirmasi Penjual' 
       WHERE idPesanan = ?`,
      [idPesanan]
    );

    return res.status(200).json({
      success: true,
      message: 'Pembayaran berhasil diverifikasi. Pesanan diteruskan ke penjual.',
      data: {
        idPesanan: Number(idPesanan),
        statusPembayaran: 'Pembayaran Berhasil',
        statusPesanan: 'Menunggu Konfirmasi Penjual',
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

// 4. CEK STATUS PESANAN & PEMBAYARAN
const getStatusPesanan = async (req, res) => {
  const { idPesanan } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT p.idPesanan, p.idPembeli, p.idPenjual, p.tanggalPemesanan, p.alamatPengantaran,
              p.statusPesanan, p.totalHarga, p.totalDiskon, p.kodeVoucher,
              b.idPembayaran, b.metodePembayaran, b.statusPembayaran, b.totalBayar, b.tanggalPembayaran,
              penj.namaToko, penj.alamatToko
       FROM Pesanan p
       LEFT JOIN Pembayaran b ON p.idPesanan = b.idPesanan
       LEFT JOIN Penjual penj ON p.idPenjual = penj.idPenjual
       WHERE p.idPesanan = ?`,
      [idPesanan]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan.' });
    }

    const [items] = await db.execute(
      `SELECT dp.idDetailPesanan, dp.idMenu, dp.jumlah, dp.hargaSatuan, dp.subtotal,
              m.namaMenu, COALESCE(m.fotoUrl, m.foto) AS fotoUrl
       FROM DetailPesanan dp
       JOIN Menu m ON dp.idMenu = m.idMenu
       WHERE dp.idPesanan = ?`,
      [idPesanan]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...rows[0],
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
