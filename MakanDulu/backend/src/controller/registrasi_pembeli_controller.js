const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { validateBuyerRegistration } = require('../validation/registrasiPengguna');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const CONTACT_DUPLICATE_MESSAGE =
  'Email atau nomor telepon sudah terdaftar. Silahkan gunakan data lain atau login.';

const findExistingContact = async (email, phone) => {
  const [rows] = await db.execute(
    `SELECT email, nomorTelepon
     FROM Pembeli
     WHERE email = ? OR nomorTelepon = ?
     UNION ALL
     SELECT email, nomorTelepon
     FROM Penjual
     WHERE email = ? OR nomorTelepon = ?`,
    [email, phone, email, phone]
  );
  return rows;
};

const isContactDuplicateError = (error) =>
  error.code === 'ER_DUP_ENTRY' &&
  /(email|nomorTelepon)/i.test(error.message || '');

const registerBuyer = async (req, res) => {
  if (!validateBuyerRegistration(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Semua kolom pendaftaran Pembeli wajib diisi dengan benar, termasuk nomor handphone Indonesia tanpa spasi atau karakter khusus.',
    });
  }

  const { name, email, password, phone, address } = req.body;
  const emailBersih = email.toLowerCase().trim();

  try {
    const kontakTerdaftar = await findExistingContact(emailBersih, phone.trim());
    if (kontakTerdaftar.length > 0) {
      return res.status(409).json({
        success: false,
        message: CONTACT_DUPLICATE_MESSAGE,
      });
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);
    const [hasil] = await db.execute(
      `INSERT INTO Pembeli (email, password, nama, nomorTelepon, alamat)
       VALUES (?, ?, ?, ?, ?)`,
      [emailBersih, hashedPassword, name.trim(), phone.trim(), address.trim()]
    );
    const idPembeli = hasil.insertId;

    await db.execute(
      `INSERT INTO Role (idPembeli, idPenjual, role) VALUES (?, NULL, 'Pembeli')`,
      [idPembeli]
    );

    const token = jwt.sign(
      { id: idPembeli, role: 'Pembeli' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(201).json({
      success: true,
      message: 'Akun Pembeli berhasil dibuat.',
      token,
      user: {
        id: idPembeli,
        name: name.trim(),
        email: emailBersih,
        phone: phone.trim(),
        address: address.trim(),
        role: 'Pembeli',
      },
    });
  } catch (error) {
    console.error('[registerBuyer] Error:', error);
    if (isContactDuplicateError(error)) {
      return res.status(409).json({
        success: false,
        message: CONTACT_DUPLICATE_MESSAGE,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mendaftarkan Pembeli.',
    });
  }
};

module.exports = { registerBuyer };