const db = require('../config/db');


const VALID_ROLES = ['Pembeli', 'Penjual'];

const pilihRole = async (req, res) => {
  const { role, userId } = req.body || {};

  // --- Validasi input (Control) ---
  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Role tidak valid. Pilih salah satu: ${VALID_ROLES.join(' atau ')}.`,
    });
  }

  try {
    // --- simpan_role → Entity Preferensi_Role ---
    if (userId) {
      // Jika userId tersedia, upsert preferensi role ke DB
      await db.execute(
        `INSERT INTO Preferensi_Role (idPengguna, role, dipilihPada)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE role = VALUES(role), dipilihPada = NOW()`,
        [userId, role]
      );
    }

    const redirectTarget =
      role === 'Pembeli'
        ? '/login/pembeli'
        : '/login/penjual';

    return res.status(200).json({
      success: true,
      message: `Role ${role} berhasil dipilih.`,
      data: {
        role,
        redirectTo: redirectTarget,
      },
    });
  } catch (error) {
    console.error('[RoleController.pilihRole] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat menyimpan pilihan role.',
    });
  }
};

const getPreferensiRole = async (req, res) => {
  const { userId } = req.params;

  if (!userId || isNaN(Number(userId))) {
    return res.status(400).json({
      success: false,
      message: 'userId tidak valid.',
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT role, dipilihPada FROM Preferensi_Role WHERE idPengguna = ? LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Preferensi role untuk pengguna ini belum tersimpan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('[RoleController.getPreferensiRole] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengambil preferensi role.',
    });
  }
};

module.exports = { pilihRole, getPreferensiRole };
