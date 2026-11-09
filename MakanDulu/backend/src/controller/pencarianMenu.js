const db = require('../config/db');
const searchMenu = async (req, res) => {
  const search = String(req.query.search || '').trim();

  if (!search) {
    return res.status(400).json({
      success: false,
      message: 'Kata pencarian wajib diisi.',
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT idMenu, idPenjual, namaMenu, harga, kategori, foto, deskripsi
       FROM Menu
       WHERE namaMenu LIKE ?
       AND statusAktif = TRUE
       ORDER BY namaMenu ASC`,
      [`%${search}%`]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('[searchMenu] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mencari menu.',
    });
  }
};