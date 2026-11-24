'use strict';

const db = require('../config/db');

/**
 * Controller: Ulasan & Rating (BCE: Control Object ulasan_controller)
 * Skenario Utama:
 * 1. Pembeli membuka riwayat pesanan selesai dan menekan tombol "Beri Ulasan".
 * 2. Sistem menampilkan formulir pemberian rating dan ulasan.
 * 3. Pembeli memilih jumlah bintang (1-5), menulis ulasan teks, dan melampirkan foto makanan -> menekan "Kirim Ulasan".
 * 4. Sistem menyimpan data rating dan ulasan ke Entity Ulasan di database.
 * 5. Sistem menghitung ulang rata-rata rating menu & toko dan menampilkan pesan "Terima Kasih Atas Ulasan Anda".
 */

// Helper parse tags & komentar
const formatKomentarDenganTag = (komentar, tags) => {
  let teks = (komentar || '').trim();
  if (Array.isArray(tags) && tags.length > 0) {
    const tagString = tags.map((t) => `#${t.replace(/\s+/g, '')}`).join(' ');
    if (!teks.includes('#')) {
      teks = `${teks} [Kelebihan: ${tags.join(', ')}]`;
    }
  }
  return teks;
};

// 1. KIRIM ULASAN & RATING (LANGKAH 3, 4, 5)
const kirimUlasan = async (req, res) => {
  try {
    const idPembeliToken = req.user?.id;
    const {
      idPesanan,
      idPembeli: idPembeliBody,
      rating,
      komentar,
      tags,
      fotoUlasan,
    } = req.body;

    const idPembeli = idPembeliToken || idPembeliBody || 1;

    // Validasi ID Pesanan
    if (!idPesanan) {
      return res.status(400).json({
        success: false,
        message: 'ID Pesanan wajib disertakan untuk memberikan ulasan.',
      });
    }

    // Validasi Bintang Rating (1 - 5)
    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating harus berupa angka antara 1 sampai 5 bintang.',
      });
    }

    // Validasi Komentar Teks
    const komentarTeks = formatKomentarDenganTag(komentar, tags);
    if (!komentarTeks || komentarTeks.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Ulasan teks wajib diisi minimal 3 karakter.',
      });
    }

    // Periksa Keberadaan dan Status Pesanan (Pre-Kondisi: Pesanan Pembeli telah berstatus Selesai)
    const [pesananRows] = await db.execute(
      `SELECT idPesanan, idPembeli, idPenjual, statusPesanan 
       FROM Pesanan 
       WHERE idPesanan = ?`,
      [idPesanan]
    );

    if (pesananRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Pesanan #${idPesanan} tidak ditemukan di sistem.`,
      });
    }

    const pesanan = pesananRows[0];

    // Cek apakah status pesanan selesai
    const statusBiasa = String(pesanan.statusPesanan || '').toLowerCase();
    const isSelesai = statusBiasa.includes('selesai');
    if (!isSelesai) {
      return res.status(400).json({
        success: false,
        message: 'Ulasan hanya dapat diberikan untuk pesanan yang telah berstatus Selesai.',
      });
    }

    // Cek apakah ulasan untuk pesanan ini sudah pernah dikirim sebelumnya
    const [ulasanLama] = await db.execute(
      `SELECT idUlasan FROM Ulasan WHERE idPesanan = ?`,
      [idPesanan]
    );

    let idUlasanHasil;
    if (ulasanLama.length > 0) {
      // Perbarui ulasan jika sudah ada
      idUlasanHasil = ulasanLama[0].idUlasan;
      await db.execute(
        `UPDATE Ulasan 
         SET rating = ?, komentar = ?, fotoUlasan = ?, tanggalUlasan = NOW()
         WHERE idUlasan = ?`,
        [ratingNum, komentarTeks, fotoUlasan || null, idUlasanHasil]
      );
    } else {
      // Simpan data rating dan ulasan baru ke Entity Ulasan (Langkah 4)
      const [insertResult] = await db.execute(
        `INSERT INTO Ulasan (idPembeli, idPesanan, rating, komentar, fotoUlasan, tanggalUlasan)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [idPembeli, idPesanan, ratingNum, komentarTeks, fotoUlasan || null]
      );
      idUlasanHasil = insertResult.insertId;
    }

    // --- LANGKAH 5: Menghitung ulang rata-rata rating menu & toko ---
    // 5a. Hitung ulang rata-rata rating toko/mitra
    const [tokoRatingRows] = await db.execute(
      `SELECT ROUND(AVG(u.rating), 1) AS rataRataRatingToko, COUNT(u.idUlasan) AS totalUlasanToko
       FROM Ulasan u
       JOIN Pesanan p ON u.idPesanan = p.idPesanan
       WHERE p.idPenjual = ?`,
      [pesanan.idPenjual]
    );

    const rataRataRatingToko = Number(tokoRatingRows[0]?.rataRataRatingToko || ratingNum);
    const totalUlasanToko = Number(tokoRatingRows[0]?.totalUlasanToko || 1);

    // 5b. Hitung ulang rata-rata rating setiap menu dalam pesanan tersebut
    const [menuRatingRows] = await db.execute(
      `SELECT dp.idMenu, m.namaMenu,
              ROUND(AVG(u.rating), 1) AS rataRataRatingMenu,
              COUNT(DISTINCT u.idUlasan) AS totalUlasanMenu
       FROM DetailPesanan dp
       JOIN Menu m ON dp.idMenu = m.idMenu
       LEFT JOIN DetailPesanan dp_all ON dp.idMenu = dp_all.idMenu
       LEFT JOIN Ulasan u ON dp_all.idPesanan = u.idPesanan
       WHERE dp.idPesanan = ?
       GROUP BY dp.idMenu, m.namaMenu`,
      [idPesanan]
    );

    // Menampilkan pesan sesuai spesifikasi use case: "Terima Kasih Atas Ulasan Anda"
    return res.status(200).json({
      success: true,
      message: 'Terima Kasih Atas Ulasan Anda',
      data: {
        idUlasan: idUlasanHasil,
        idPesanan: Number(idPesanan),
        idPenjual: pesanan.idPenjual,
        rating: ratingNum,
        komentar: komentarTeks,
        fotoUlasan: fotoUlasan || null,
        rekapitulasiRating: {
          toko: {
            idPenjual: pesanan.idPenjual,
            rataRata: rataRataRatingToko,
            totalUlasan: totalUlasanToko,
          },
          menu: menuRatingRows.map((r) => ({
            idMenu: r.idMenu,
            namaMenu: r.namaMenu,
            rataRata: Number(r.rataRataRatingMenu || ratingNum),
            totalUlasan: Number(r.totalUlasanMenu || 1),
          })),
        },
      },
    });
  } catch (error) {
    console.error('[UlasanController.kirimUlasan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan rating dan ulasan: ' + error.message,
    });
  }
};

// 2. AMBIL ULASAN BERDASARKAN ID PESANAN
const getUlasanByPesanan = async (req, res) => {
  const { idPesanan } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT u.idUlasan, u.idPembeli, u.idPesanan, u.rating, u.komentar, u.fotoUlasan, u.tanggalUlasan,
              p.nama AS namaPembeli,
              pes.idPenjual, penj.namaToko
       FROM Ulasan u
       LEFT JOIN Pembeli p ON u.idPembeli = p.idPembeli
       LEFT JOIN Pesanan pes ON u.idPesanan = pes.idPesanan
       LEFT JOIN Penjual penj ON pes.idPenjual = penj.idPenjual
       WHERE u.idPesanan = ?`,
      [idPesanan]
    );

    if (rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Belum ada ulasan untuk pesanan ini.',
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('[UlasanController.getUlasanByPesanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil ulasan pesanan.',
    });
  }
};

// 3. AMBIL DAFTAR ULASAN TOKO
const getUlasanByToko = async (req, res) => {
  const { idPenjual } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT u.idUlasan, u.idPesanan, u.rating, u.komentar, u.fotoUlasan, u.tanggalUlasan,
              p.nama AS namaPembeli
       FROM Ulasan u
       JOIN Pesanan pes ON u.idPesanan = pes.idPesanan
       LEFT JOIN Pembeli p ON u.idPembeli = p.idPembeli
       WHERE pes.idPenjual = ?
       ORDER BY u.tanggalUlasan DESC
       LIMIT 50`,
      [idPenjual]
    );

    const [stat] = await db.execute(
      `SELECT ROUND(AVG(u.rating), 1) AS rataRataRating, COUNT(u.idUlasan) AS totalUlasan
       FROM Ulasan u
       JOIN Pesanan pes ON u.idPesanan = pes.idPesanan
       WHERE pes.idPenjual = ?`,
      [idPenjual]
    );

    return res.status(200).json({
      success: true,
      data: {
        daftarUlasan: rows,
        statistik: {
          rataRataRating: Number(stat[0]?.rataRataRating || 0),
          totalUlasan: Number(stat[0]?.totalUlasan || 0),
        },
      },
    });
  } catch (error) {
    console.error('[UlasanController.getUlasanByToko] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil ulasan toko.',
    });
  }
};

module.exports = {
  kirimUlasan,
  getUlasanByPesanan,
  getUlasanByToko,
};
