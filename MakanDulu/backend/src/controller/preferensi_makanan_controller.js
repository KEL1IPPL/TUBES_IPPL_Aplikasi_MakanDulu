const db = require('../config/db');

const isStringArray = (value) =>
  Array.isArray(value) &&
  value.length <= 50 &&
  value.every((item) => typeof item === 'string' && item.trim().length > 0);

/**
 * =============================================================================
 * SEQUENCE DIAGRAM PREFERENSI MAKANAN (MAIN FLOW):
 * 1. Pembeli -> halaman_preferensi_makanan: membuka halaman preferensi makanan
 * 2. Pembeli -> halaman_preferensi_makanan: memilih preferensi makanan
 * 3. Pembeli -> halaman_preferensi_makanan: klik simpan dan lanjut
 * 4. halaman_preferensi_makanan -> preferensi_makanan_controller: simpan preferensi makanan
 * 5. preferensi_makanan_controller -> PreferensiMakanan: simpat data
 * 6. PreferensiMakanan -> preferensi_makanan_controller: data disimpan
 * 7. preferensi_makanan_controller -> halaman_dashboard_pembeli: Tampilkan dashboard Pembeli
 * =============================================================================
 */
const simpanPreferensiMakanan = async (req, res) => {
  const idPembeli = req.user?.id || req.body.idPembeli;
  const userRole = req.user?.role || req.body.role || 'Pembeli';

  if (userRole !== 'Pembeli') {
    return res.status(403).json({
      success: false,
      message: 'Hanya Pembeli yang dapat menyimpan preferensi makanan.',
    });
  }

  // Dukung format bahasa Inggris maupun bahasa Indonesia
  const rawTastes = req.body?.tastes || req.body?.rasaFavorit || [];
  const rawCategories = req.body?.categories || req.body?.kategoriFavorit || [];
  const rawDietary = req.body?.dietary || req.body?.polaMakan || [];

  const tastes = Array.isArray(rawTastes) ? rawTastes : [rawTastes];
  const categories = Array.isArray(rawCategories) ? rawCategories : [rawCategories];
  const dietary = Array.isArray(rawDietary) ? rawDietary : [rawDietary];

  try {
    // 5. simpan data -> Entity PreferensiMakanan
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
        idPembeli,
        JSON.stringify(tastes),
        JSON.stringify(categories),
        JSON.stringify(dietary),
      ]
    );

    // 6. data disimpan
    const [rows] = await db.execute(
      `SELECT idPreferensi, idPembeli, rasaFavorit, kategoriFavorit, polaMakan, waktuDiubah
       FROM PreferensiMakanan
       WHERE idPembeli = ?`,
      [idPembeli]
    );

    const preference = rows[0] || {};
    return res.status(result.insertId ? 201 : 200).json({
      success: true,
      message: 'Preferensi makanan berhasil disimpan.',
      data: {
        idPreferensi: preference.idPreferensi,
        idPembeli: preference.idPembeli,
        tastes,
        categories,
        dietary,
        updatedAt: preference.waktuDiubah,
      },
    });
  } catch (error) {
    console.error('[simpanPreferensiMakanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan preferensi makanan ke database.',
    });
  }
};

/**
 * =============================================================================
 * SEQUENCE DIAGRAM PREFERENSI MAKANAN (ALTERNATIVE FLOW):
 * 1. Pembeli -> halaman_preferensi_makanan: membuka halaman preferensi makanan
 * 2. Pembeli -> halaman_preferensi_makanan: klik tombol "Lewati"
 * 3. halaman_preferensi_makanan -> preferensi_makanan_controller: lewati pemilihan preferensi makanan
 * 4. preferensi_makanan_controller -> halaman_dashboard_pembeli: Tampilkan halaman dashboard Pembeli
 * =============================================================================
 */
const lewatiPreferensiMakanan = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Pemilihan preferensi makanan dilewati.',
    });
  } catch (error) {
    console.error('[lewatiPreferensiMakanan] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat melewati preferensi makanan.',
    });
  }
};

module.exports = {
  simpanPreferensiMakanan,
  lewatiPreferensiMakanan,
};
