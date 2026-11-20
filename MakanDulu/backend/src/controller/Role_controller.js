const db = require('../config/db');

/**
 * RoleController — Skenario Pemilihan Role oleh Pengguna
 *
 * Diagram Robustness:
 *   Boundary (Halaman_Utama) → pilih_role(role) → Control Object (RoleController)
 *   RoleController → simpan_role → Entity (Preferensi_Role)
 *   Entity → role_disimpan → RoleController
 *   RoleController → redirect → Boundary (Halaman_login/registrasi)
 */

const VALID_ROLES = ['Pembeli', 'Penjual'];

/**
 * POST /api/role/pilih
 * Body: { role: 'Pembeli' | 'Penjual', userId?: number }
 *
 * Menerima pilihan role dari Halaman_Utama (Boundary),
 * memvalidasi role, menyimpan ke tabel Preferensi_Role (Entity),
 * lalu mengembalikan redirect target ke Halaman_login/registrasi.
 */
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

    // --- role_disimpan → kembalikan ke Boundary ---
    // Tentukan redirect target berdasarkan role yang dipilih
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

/**
 * GET /api/role/preferensi/:userId
 * Mengambil preferensi role terakhir pengguna dari Entity Preferensi_Role.
 */
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
