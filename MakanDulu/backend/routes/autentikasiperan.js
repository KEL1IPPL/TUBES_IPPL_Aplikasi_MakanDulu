const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password ||
      !['Pembeli', 'Penjual'].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email, kata sandi, dan role wajib diisi.',
      });
    }

    let sql;
    let params;

    if (role === 'Pembeli') {
      sql = `
        SELECT
          p.idPembeli AS id,
          p.email,
          p.password,
          p.nama AS nama,
          p.nomorTelepon AS telepon,
          p.alamat AS alamat
        FROM Pembeli p
        INNER JOIN Role r
          ON r.idPembeli = p.idPembeli
        WHERE LOWER(p.email) = LOWER(?)
          AND r.role = 'Pembeli'
        LIMIT 1
      `;
      params = [email.trim()];
    } else {
      sql = `
        SELECT
          p.idPenjual AS id,
          p.email,
          p.password,
          p.namaPemilik AS nama,
          p.namaToko AS namaToko,
          p.nomorTelepon AS telepon,
          p.alamatToko AS alamat
        FROM Penjual p
        INNER JOIN Role r
          ON r.idPenjual = p.idPenjual
        WHERE LOWER(p.email) = LOWER(?)
          AND r.role = 'Penjual'
        LIMIT 1
      `;
      params = [email.trim()];
    }

    const [rows] = await db.execute(sql, params);
    const akun = rows[0];

    // Gunakan pesan yang sama agar tidak membocorkan
    // apakah email tertentu terdaftar.
    if (!akun) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak cocok.',
      });
    }

    let passwordCocok = false;

    try {
      passwordCocok = await bcrypt.compare(password, akun.password);
    } catch (error) {
      // Data seed lama mungkin masih menyimpan password sebagai teks biasa.
      passwordCocok = false;
    }

    if (!passwordCocok && akun.password === password) {
      const passwordHash = await bcrypt.hash(password, 10);
      const table = role === 'Pembeli' ? 'Pembeli' : 'Penjual';
      const idColumn = role === 'Pembeli' ? 'idPembeli' : 'idPenjual';

      await db.execute(
        `UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`,
        [passwordHash, akun.id]
      );
      passwordCocok = true;
    }

    if (!passwordCocok) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi tidak cocok.',
      });
    }

    const token = jwt.sign(
      {
        id: akun.id,
        role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: akun.id,
        name: akun.nama,
        email: akun.email,
        phone: akun.telepon,
        address: akun.alamat,
        role,
        ...(role === 'Penjual'
          ? { storeName: akun.namaToko }
          : {}),
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
});

module.exports = router;