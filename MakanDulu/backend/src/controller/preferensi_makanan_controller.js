const db = require('../config/db');

const isStringArray = (value) =>
  Array.isArray(value) &&
  value.length <= 50 &&
  value.every((item) => typeof item === 'string' && item.trim().length > 0);

const simpanPreferensiMakanan = async (req, res) => {
  if (req.user.role !== 'Pembeli') {
    return res.status(403).json({
      success: false,
      message: 'Hanya Pembeli yang dapat menyimpan preferensi makanan.',
    });
  }

  const { tastes, categories, dietary } = req.body || {};
  if (!isStringArray(tastes) || !isStringArray(categories) || !isStringArray(dietary)) {
    return res.status(400).json({
      success: false,
      message: 'tastes, categories, dan dietary wajib berupa array teks.',
    });
  }

  try {
    const [result] = await db.execute(
      `INSERT INTO PreferensiMakanan
        (idPembeli, rasaFavorit, kategoriFavorit, polaMakan, waktuDiubah)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
        rasaFavorit = VALUES(rasaFavorit),
        kategoriFavorit = VALUES(kategoriFavorit),
        polaMakan = VALUES(polaMakan),
        waktuDiubah = CURRENT_TIMESTAMP`,
      [
        req.user.id,
        JSON.stringify(tastes),
        JSON.stringify(categories),
        JSON.stringify(dietary),
      ]
    );

    const [rows] = await db.execute(
      `SELECT idPreferensi, idPembeli, rasaFavorit, kategoriFavorit, polaMakan, waktuDiubah
       FROM PreferensiMakanan
       WHERE idPembeli = ?`,
      [req.user.id]
    );

    const preference = rows[0];
    return res.status(result.insertId ? 201 : 200).json({
      success: true,
      message: 'Preferensi makanan berhasil disimpan.',
      data: {
        idPreferensi: preference.idPreferensi,
        idPembeli: preference.idPembeli,
        tastes: JSON.parse(preference.rasaFavorit),
        categories: JSON.parse(preference.kategoriFavorit),
        dietary: JSON.parse(preference.polaMakan),
        updatedAt: preference.waktuDiubah,
      },
    });
  } catch (error) {
    console.error('[simpanPreferensiMakanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan preferensi makanan.',
    });
  }
};

module.exports = { simpanPreferensiMakanan };
