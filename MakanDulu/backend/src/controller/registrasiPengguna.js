const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const {
  validateBuyerRegistration,
  validateSellerRegistration,
} = require('../validation/registrasiPengguna');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

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
    const [cekEmail] = await db.execute(
      'SELECT idPembeli FROM Pembeli WHERE email = ?',
      [emailBersih]
    );
    if (cekEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Email '${emailBersih}' sudah terdaftar sebagai Pembeli.`,
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
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mendaftarkan Pembeli.',
    });
  }
};

const registerSeller = async (req, res) => {
  if (!validateSellerRegistration(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Data usaha wajib diisi. NIB harus 13 digit, KTP 16 digit, NPWP 21 digit, dan nomor handphone harus valid.',
    });
  }

  const { ownerName, storeName, email, password, phone, storeAddress, nib, ktp, npwp } = req.body;
  const emailBersih = email.toLowerCase().trim();

  try {
    const [cekEmail] = await db.execute(
      'SELECT idPenjual FROM Penjual WHERE email = ?',
      [emailBersih]
    );
    if (cekEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Email '${emailBersih}' sudah terdaftar sebagai Penjual.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [hasil] = await db.execute(
      `INSERT INTO Penjual (email, password, namaPemilik, namaToko, nomorTelepon, alamatToko, NIB, NPWP, KTP)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [emailBersih, hashedPassword, ownerName.trim(), storeName.trim(), phone.trim(),
        storeAddress.trim(), nib.trim(), npwp.trim(), ktp.trim()]
    );
    const idPenjual = hasil.insertId;

    await db.execute(
      `INSERT INTO Role (idPembeli, idPenjual, role) VALUES (NULL, ?, 'Penjual')`,
      [idPenjual]
    );

    const token = jwt.sign(
      { id: idPenjual, role: 'Penjual' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return res.status(201).json({
      success: true,
      message: `Akun Penjual untuk toko '${storeName.trim()}' berhasil dibuat.`,
      token,
      user: {
        id: idPenjual,
        name: ownerName.trim(),
        email: emailBersih,
        phone: phone.trim(),
        address: storeAddress.trim(),
        role: 'Penjual',
        storeName: storeName.trim(),
      },
    });
  } catch (error) {
    console.error('[registerSeller] Error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email, nomor telepon, NIB, NPWP, atau KTP yang dimasukkan sudah terdaftar di sistem.',
      });
    }
    if (error.code === 'ER_DATA_TOO_LONG' || error.code === 'WARN_DATA_TRUNCATED') {
      return res.status(400).json({
        success: false,
        message: 'Panjang data penjual tidak sesuai format database. Periksa nama, nomor telepon, NIB, NPWP, dan KTP.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mendaftarkan Penjual.',
    });
  }
};

module.exports = { registerBuyer, registerSeller };
