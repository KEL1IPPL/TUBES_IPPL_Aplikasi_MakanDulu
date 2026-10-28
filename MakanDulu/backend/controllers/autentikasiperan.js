const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const Pembeli = require('../src/class/Pembeli');
const Penjual = require('../src/class/Penjual');
const {
  validateBuyerRegistration,
  validateSellerRegistration,
  validateLogin,
} = require('../validation/autentikasiperan');

const createToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '2h' });

const duplicateResponse = (error, duplicateMessage) => {
  const duplicate = error.code === 'ER_DUP_ENTRY';
  return {
    status: duplicate ? 409 : 500,
    body: {
      success: false,
      message: duplicate ? duplicateMessage : 'Terjadi kesalahan pada server.',
    },
  };
};

const registerBuyer = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!validateBuyerRegistration(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, kata sandi, nomor telepon, dan alamat wajib diisi.',
      });
    }

    const pembeli = new Pembeli(
      null,
      name.trim(),
      email.trim(),
      password,
      phone.trim(),
      address.trim()
    );
    const id = await pembeli.registrasi();

    return res.status(201).json({
      success: true,
      message: 'Registrasi Pembeli berhasil.',
      token: createToken(id, 'Pembeli'),
      user: {
        id,
        name: pembeli.nama,
        email: pembeli.email,
        phone: pembeli.nomorTelepon,
        address: pembeli.alamat,
        role: 'Pembeli',
      },
    });
  } catch (error) {
    console.error('Buyer registration error:', error);
    const response = duplicateResponse(error, 'Email atau nomor telepon sudah terdaftar.');
    return res.status(response.status).json(response.body);
  }
};

const registerSeller = async (req, res) => {
  try {
    const {
      ownerName,
      storeName,
      email,
      password,
      phone,
      storeAddress,
      nib,
      ktp,
      npwp,
    } = req.body;

    if (!validateSellerRegistration(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Seluruh data usaha dan dokumen legalitas wajib diisi.',
      });
    }

    const penjual = new Penjual(
      null,
      ownerName.trim(),
      email.trim(),
      password,
      storeName.trim(),
      phone.trim(),
      storeAddress.trim(),
      nib.trim(),
      npwp.trim(),
      ktp.trim()
    );
    const id = await penjual.registrasi();

    return res.status(201).json({
      success: true,
      message: 'Registrasi Penjual berhasil.',
      token: createToken(id, 'Penjual'),
      user: {
        id,
        name: penjual.namaPemilik,
        ownerName: penjual.namaPemilik,
        storeName: penjual.namaToko,
        email: penjual.email,
        phone: penjual.nomorTelepon,
        address: penjual.alamatToko,
        role: 'Penjual',
      },
    });
  } catch (error) {
    console.error('Seller registration error:', error);
    const response = duplicateResponse(
      error,
      'Email, nomor telepon, NIB, NPWP, atau KTP sudah terdaftar.'
    );
    return res.status(response.status).json(response.body);
  }
};

const getLoginQuery = (role) => {
  if (role === 'Pembeli') {
    return {
      sql: `
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
      `,
      table: 'Pembeli',
      idColumn: 'idPembeli',
    };
  }

  return {
    sql: `
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
    `,
    table: 'Penjual',
    idColumn: 'idPenjual',
  };
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!validateLogin(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Email, kata sandi, dan role wajib diisi.',
      });
    }

    const query = getLoginQuery(role);
    const [rows] = await db.execute(query.sql, [email.trim()]);
    const akun = rows[0];

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
      passwordCocok = false;
    }

    if (!passwordCocok && akun.password === password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await db.execute(
        `UPDATE ${query.table} SET password = ? WHERE ${query.idColumn} = ?`,
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

    const token = createToken(akun.id, role);

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
        ...(role === 'Penjual' ? { storeName: akun.namaToko } : {}),
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  registerBuyer,
  registerSeller,
  login,
};
