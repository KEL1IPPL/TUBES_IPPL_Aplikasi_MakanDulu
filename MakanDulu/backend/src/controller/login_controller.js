const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const login = async (req, res) => {
  const { email, password, role } = req.body || {};
  if (
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password ||
    (role !== 'Pembeli' && role !== 'Penjual')
  ) {
    return res.status(400).json({
      success: false,
      message: 'Email, kata sandi, dan peran (Pembeli/Penjual) wajib diisi.',
    });
  }
  const emailBersih = email.toLowerCase().trim();

  try {
    let user = null;
    if (role === 'Pembeli') {
      const [rows] = await db.execute(
        `SELECT idPembeli AS id, nama AS name, email, password,
                nomorTelepon AS phone, alamat AS address
         FROM Pembeli WHERE email = ?`,
        [emailBersih]
      );
      if (rows.length > 0) user = { ...rows[0], role: 'Pembeli' };
    } else {
      const [rows] = await db.execute(
        `SELECT idPenjual AS id, namaPemilik AS name, namaPemilik AS ownerName, email, password,
                nomorTelepon AS phone, alamatToko AS address, namaToko AS storeName,
                NIB AS nibNumber, NPWP AS npwpNumber, KTP AS ktpNumber
         FROM Penjual WHERE email = ?`,
        [emailBersih]
      );
      if (rows.length > 0) user = { ...rows[0], role: 'Penjual' };
    }

    let isMatch = false;
    if (user && user.password) {
      if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = (password === user.password);
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi salah.',
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    const { password: _, ...userData } = user;

    return res.status(200).json({
      success: true,
      message: `Login berhasil sebagai ${user.role}.`,
      token,
      user: userData,
    });
  } catch (error) {
    console.error('[login] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat proses login.',
    });
  }
};

//Mengambil data profil pengguna yang sedang login berdasarkan token JWT
const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user || {};
    if (!id || !role) {
      return res.status(401).json({
        success: false,
        message: 'Identitas pengguna pada token tidak valid.',
      });
    }

    let user = null;
    if (role === 'Pembeli') {
      const [rows] = await db.execute(
        `SELECT idPembeli AS id, nama AS name, email,
                nomorTelepon AS phone, alamat AS address
         FROM Pembeli WHERE idPembeli = ?`,
        [id]
      );
      if (rows.length > 0) user = { ...rows[0], role: 'Pembeli' };
    } else {
      const [rows] = await db.execute(
        `SELECT idPenjual AS id, namaPemilik AS name, namaPemilik AS ownerName, email,
                nomorTelepon AS phone, alamatToko AS address, namaToko AS storeName,
                NIB AS nibNumber, NPWP AS npwpNumber, KTP AS ktpNumber
         FROM Penjual WHERE idPenjual = ?`,
        [id]
      );
      if (rows.length > 0) user = { ...rows[0], role: 'Penjual' };
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Data profil pengguna tidak ditemukan di database.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('[getProfile] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil dari database.',
    });
  }
};

module.exports = { login, getProfile };
