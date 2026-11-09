const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { validateLogin } = require('../validation/loginPengguna');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

const login = async (req, res) => {
  if (!validateLogin(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Email, kata sandi, dan peran (Pembeli/Penjual) wajib diisi.',
    });
  }

  const { email, password, role } = req.body;
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
        `SELECT idPenjual AS id, namaPemilik AS name, email, password,
                nomorTelepon AS phone, alamatToko AS address, namaToko AS storeName
         FROM Penjual WHERE email = ?`,
        [emailBersih]
      );
      if (rows.length > 0) user = { ...rows[0], role: 'Penjual' };
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
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

module.exports = { login };
