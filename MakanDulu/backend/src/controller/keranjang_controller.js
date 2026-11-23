'use strict';

const db = require('../config/db');

/**
 * Controller Keranjang
 * Mengelola data keranjang pembeli di database (Entity Keranjang & ItemKeranjang)
 */

// 1. MINTA ISI KERANJANG (LANGKAH 2–5)
const getKeranjang = async (req, res) => {
  const idPembeli = req.user?.id || req.query.idPembeli || 1;

  try {
    // Pastikan record Keranjang untuk pembeli ini ada
    let [cartRows] = await db.execute(
      'SELECT idKeranjang, idPembeli, totalHarga FROM Keranjang WHERE idPembeli = ?',
      [idPembeli]
    );

    let idKeranjang;
    if (cartRows.length === 0) {
      const [insertRes] = await db.execute(
        'INSERT INTO Keranjang (idPembeli, totalHarga) VALUES (?, 0)',
        [idPembeli]
      );
      idKeranjang = insertRes.insertId;
    } else {
      idKeranjang = cartRows[0].idKeranjang;
    }

    // Ambil daftar item dalam keranjang beserta data menu terkini
    const [itemRows] = await db.execute(
      `SELECT ik.idItemKeranjang, ik.idKeranjang, ik.idMenu, ik.jumlah, ik.hargaSatuan, ik.subtotal,
              m.namaMenu, m.kategori, COALESCE(m.fotoUrl, m.foto) AS fotoUrl, m.statusAktif,
              p.namaToko, p.alamatToko
       FROM ItemKeranjang ik
       JOIN Menu m ON ik.idMenu = m.idMenu
       JOIN Penjual p ON m.idPenjual = p.idPenjual
       WHERE ik.idKeranjang = ?`,
      [idKeranjang]
    );

    let calculatedTotal = 0;
    const items = itemRows.map((it) => {
      calculatedTotal += Number(it.subtotal);
      return {
        id: `cart-db-${it.idItemKeranjang}`,
        idItemKeranjang: it.idItemKeranjang,
        idMenu: it.idMenu,
        name: it.namaMenu,
        price: Number(it.hargaSatuan),
        qty: it.jumlah,
        subtotal: Number(it.subtotal),
        imageUrl: it.fotoUrl,
        restaurant: it.namaToko,
        isAvailable: Boolean(it.statusAktif),
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Data keranjang berhasil dimuat.',
      data: {
        idKeranjang,
        idPembeli,
        totalHarga: calculatedTotal,
        items,
      },
    });
  } catch (error) {
    console.error('[KeranjangController.getKeranjang] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat isi keranjang.',
    });
  }
};

// 2. TAMBAH / UPDATE ITEM KE KERANJANG
const tambahItemKeranjang = async (req, res) => {
  const idPembeli = req.user?.id || req.body.idPembeli || 1;
  const { idMenu, jumlah = 1 } = req.body;

  if (!idMenu) {
    return res.status(400).json({ success: false, message: 'idMenu wajib diisi.' });
  }

  try {
    // Ambil data menu dan pastikan stok aktif
    const [menuRows] = await db.execute(
      'SELECT idMenu, namaMenu, harga, statusAktif FROM Menu WHERE idMenu = ?',
      [idMenu]
    );

    if (menuRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Menu tidak ditemukan.' });
    }

    const menu = menuRows[0];
    if (menu.statusAktif === 0 || menu.statusAktif === false) {
      return res.status(400).json({
        success: false,
        message: `Menu "${menu.namaMenu}" sedang habis stoknya (nonaktif). Tidak dapat dimasukkan ke keranjang.`,
      });
    }

    // Ambil idKeranjang
    let [cartRows] = await db.execute(
      'SELECT idKeranjang FROM Keranjang WHERE idPembeli = ?',
      [idPembeli]
    );

    let idKeranjang;
    if (cartRows.length === 0) {
      const [insertRes] = await db.execute(
        'INSERT INTO Keranjang (idPembeli, totalHarga) VALUES (?, 0)',
        [idPembeli]
      );
      idKeranjang = insertRes.insertId;
    } else {
      idKeranjang = cartRows[0].idKeranjang;
    }

    // Cek apakah item sudah ada di keranjang
    const [existing] = await db.execute(
      'SELECT idItemKeranjang, jumlah, hargaSatuan FROM ItemKeranjang WHERE idKeranjang = ? AND idMenu = ?',
      [idKeranjang, idMenu]
    );

    const hargaSatuan = Number(menu.harga);
    if (existing.length > 0) {
      const jumlahBaru = existing[0].jumlah + Number(jumlah);
      const subtotalBaru = hargaSatuan * jumlahBaru;
      await db.execute(
        'UPDATE ItemKeranjang SET jumlah = ?, subtotal = ? WHERE idItemKeranjang = ?',
        [jumlahBaru, subtotalBaru, existing[0].idItemKeranjang]
      );
    } else {
      const subtotal = hargaSatuan * Number(jumlah);
      await db.execute(
        `INSERT INTO ItemKeranjang (idKeranjang, idMenu, jumlah, hargaSatuan, subtotal) 
         VALUES (?, ?, ?, ?, ?)`,
        [idKeranjang, idMenu, jumlah, hargaSatuan, subtotal]
      );
    }

    // Hitung ulang total keranjang
    const [sumRows] = await db.execute(
      'SELECT SUM(subtotal) AS total FROM ItemKeranjang WHERE idKeranjang = ?',
      [idKeranjang]
    );
    const totalHarga = sumRows[0]?.total || 0;
    await db.execute('UPDATE Keranjang SET totalHarga = ? WHERE idKeranjang = ?', [totalHarga, idKeranjang]);

    return res.status(200).json({
      success: true,
      message: `${jumlah}x ${menu.namaMenu} berhasil ditambahkan ke keranjang.`,
      data: { idKeranjang, totalHarga },
    });
  } catch (error) {
    console.error('[KeranjangController.tambahItemKeranjang] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan menu ke keranjang.',
    });
  }
};

// 3. HAPUS ITEM DARI KERANJANG
const hapusItemKeranjang = async (req, res) => {
  const idPembeli = req.user?.id || 1;
  const { idItemKeranjang } = req.params;

  try {
    await db.execute(
      `DELETE ik FROM ItemKeranjang ik 
       JOIN Keranjang k ON ik.idKeranjang = k.idKeranjang 
       WHERE ik.idItemKeranjang = ? AND k.idPembeli = ?`,
      [idItemKeranjang, idPembeli]
    );

    return res.status(200).json({
      success: true,
      message: 'Item berhasil dikeluarkan dari keranjang.',
    });
  } catch (error) {
    console.error('[KeranjangController.hapusItemKeranjang] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus item dari keranjang.',
    });
  }
};

// 4. KOSONGKAN KERANJANG
const kosongkanKeranjang = async (req, res) => {
  const idPembeli = req.user?.id || 1;

  try {
    await db.execute(
      `DELETE ik FROM ItemKeranjang ik 
       JOIN Keranjang k ON ik.idKeranjang = k.idKeranjang 
       WHERE k.idPembeli = ?`,
      [idPembeli]
    );
    await db.execute('UPDATE Keranjang SET totalHarga = 0 WHERE idPembeli = ?', [idPembeli]);

    return res.status(200).json({
      success: true,
      message: 'Keranjang berhasil dikosongkan.',
    });
  } catch (error) {
    console.error('[KeranjangController.kosongkanKeranjang] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengosongkan keranjang.',
    });
  }
};

module.exports = {
  getKeranjang,
  tambahItemKeranjang,
  hapusItemKeranjang,
  kosongkanKeranjang,
};
