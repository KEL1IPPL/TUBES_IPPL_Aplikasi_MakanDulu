const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const {
  validateBuyerRegistration,
  validateSellerRegistration,
  validateLogin,
} = require('../validation/autentikasiperan');

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
    // Cek duplikasi email di tabel Pembeli
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert ke tabel Pembeli
    const [hasil] = await db.execute(
      `INSERT INTO Pembeli (email, password, nama, nomorTelepon, alamat)
       VALUES (?, ?, ?, ?, ?)`,
      [emailBersih, hashedPassword, name.trim(), phone.trim(), address.trim()]
    );

    const idPembeli = hasil.insertId;

    // Insert ke tabel Role
    await db.execute(
      `INSERT INTO Role (idPembeli, idPenjual, role) VALUES (?, NULL, 'Pembeli')`,
      [idPembeli]
    );

    // Generate JWT
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
      message: 'Semua data usaha dan berkas legalitas (NIB, KTP, NPWP) wajib diisi, termasuk nomor handphone Indonesia tanpa spasi atau karakter khusus.',
    });
  }

  const { ownerName, storeName, email, password, phone, storeAddress, nib, ktp, npwp } = req.body;
  const emailBersih = email.toLowerCase().trim();

  try {
    // Cek duplikasi email di tabel Penjual
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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert ke tabel Penjual
    const [hasil] = await db.execute(
      `INSERT INTO Penjual (email, password, namaPemilik, namaToko, nomorTelepon, alamatToko, NIB, NPWP, KTP)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emailBersih,
        hashedPassword,
        ownerName.trim(),
        storeName.trim(),
        phone.trim(),
        storeAddress.trim(),
        nib.trim(),
        npwp.trim(),
        ktp.trim(),
      ]
    );

    const idPenjual = hasil.insertId;

    // Insert ke tabel Role
    await db.execute(
      `INSERT INTO Role (idPembeli, idPenjual, role) VALUES (NULL, ?, 'Penjual')`,
      [idPenjual]
    );

    // Generate JWT
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

    // Tangani pelanggaran UNIQUE constraint (NIB/KTP/NPWP duplikat)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'NIB, KTP, atau NPWP yang dimasukkan sudah terdaftar di sistem.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mendaftarkan Penjual.',
    });
  }
};

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
    let userId = null;

    if (role === 'Pembeli') {
      const [rows] = await db.execute(
        `SELECT idPembeli AS id, nama AS name, email, password, nomorTelepon AS phone, alamat AS address
         FROM Pembeli WHERE email = ?`,
        [emailBersih]
      );
      if (rows.length > 0) {
        user = { ...rows[0], role: 'Pembeli' };
        userId = rows[0].id;
      }
    } else {
      const [rows] = await db.execute(
        `SELECT idPenjual AS id, namaPemilik AS name, email, password,
                nomorTelepon AS phone, alamatToko AS address, namaToko AS storeName
         FROM Penjual WHERE email = ?`,
        [emailBersih]
      );
      if (rows.length > 0) {
        user = { ...rows[0], role: 'Penjual' };
        userId = rows[0].id;
      }
    }

    // Email tidak ditemukan
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi salah.',
      });
    }

    // Verifikasi password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau kata sandi salah.',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: userId, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    // Hapus password dari response
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

module.exports = { registerBuyer, registerSeller, login };
