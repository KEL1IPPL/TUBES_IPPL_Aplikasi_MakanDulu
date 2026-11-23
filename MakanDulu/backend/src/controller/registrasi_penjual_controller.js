const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { validateSellerRegistration } = require('../validation/registrasiPengguna');

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

const duplicateFieldMessage = (fields) =>
  `${fields.join(', ')} sudah terdaftar di sistem.`;

const duplicateFieldsFromDatabaseError = (error) => {
  const key = error.message || '';
  const fields = [];
  if (/email/i.test(key)) fields.push('Email');
  if (/nomorTelepon|phone/i.test(key)) fields.push('Nomor telepon');
  if (/\bNIB\b/i.test(key)) fields.push('NIB');
  if (/\bNPWP\b/i.test(key)) fields.push('NPWP');
  if (/\bKTP\b/i.test(key)) fields.push('KTP');
  return fields;
};

const registerSeller = async (req, res) => {
  const legalFiles = req.files || {};
  const requiredLegalFiles = ['nibFile', 'ktpFile', 'npwpFile'];
  if (
    requiredLegalFiles.some(
      (field) =>
        !Array.isArray(legalFiles[field]) ||
        legalFiles[field].length !== 1 ||
        legalFiles[field][0].size === 0
    )
  ) {
    return res.status(400).json({
      success: false,
      message: 'Berkas NIB, KTP, dan NPWP wajib diunggah dan tidak boleh kosong.',
    });
  }

  if (!validateSellerRegistration(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Data usaha wajib diisi. NIB harus 13 digit, NIK/KTP 16 digit, NPWP 15 atau 21 digit, dan nomor handphone harus valid.',
    });
  }

  const { ownerName, storeName, email, password, phone, storeAddress, nib, ktp, npwp } = req.body;
  const emailBersih = email.toLowerCase().trim();
  const phoneBersih = phone.trim();
  const nibBersih = nib.trim();
  const ktpBersih = ktp.trim();
  const npwpBersih = npwp.trim();

  try {
    const kontakTerdaftar = await findExistingContact(emailBersih, phoneBersih);
    const duplicateContacts = [];
    if (kontakTerdaftar.some((row) => row.email === emailBersih)) {
      duplicateContacts.push('Email');
    }
    if (kontakTerdaftar.some((row) => row.nomorTelepon === phoneBersih)) {
      duplicateContacts.push('Nomor telepon');
    }
    if (duplicateContacts.length > 0) {
      return res.status(409).json({
        success: false,
        message: duplicateFieldMessage(duplicateContacts),
      });
    }

    const [penjualTerdaftar] = await db.execute(
      `SELECT NIB, NPWP, KTP
       FROM Penjual
       WHERE NIB = ? OR NPWP = ? OR KTP = ?`,
      [nibBersih, npwpBersih, ktpBersih]
    );
    const duplicateLegalities = [];
    if (penjualTerdaftar.some((row) => row.NIB === nibBersih)) {
      duplicateLegalities.push('NIB');
    }
    if (penjualTerdaftar.some((row) => row.NPWP === npwpBersih)) {
      duplicateLegalities.push('NPWP');
    }
    if (penjualTerdaftar.some((row) => row.KTP === ktpBersih)) {
      duplicateLegalities.push('KTP');
    }
    if (duplicateLegalities.length > 0) {
      return res.status(409).json({
        success: false,
        message: duplicateFieldMessage(duplicateLegalities),
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [hasil] = await db.execute(
      `INSERT INTO Penjual (email, password, namaPemilik, namaToko, nomorTelepon, alamatToko, NIB, NPWP, KTP)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [emailBersih, hashedPassword, ownerName.trim(), storeName.trim(), phoneBersih,
        storeAddress.trim(), nibBersih, npwpBersih, ktpBersih]
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
        ownerName: ownerName.trim(),
        email: emailBersih,
        phone: phone.trim(),
        address: storeAddress.trim(),
        role: 'Penjual',
        storeName: storeName.trim(),
        nibNumber: nibBersih,
        npwpNumber: npwpBersih,
        ktpNumber: ktpBersih,
      },
    });
  } catch (error) {
    console.error('[registerSeller] Error:', error);
    if (isContactDuplicateError(error)) {
      const duplicateContacts = duplicateFieldsFromDatabaseError(error)
        .filter((field) => field === 'Email' || field === 'Nomor telepon');
      return res.status(409).json({
        success: false,
        message: duplicateFieldMessage(
          duplicateContacts.length > 0 ? duplicateContacts : ['Email atau nomor telepon']
        ),
      });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      const duplicateFields = duplicateFieldsFromDatabaseError(error);
      return res.status(409).json({
        success: false,
        message: duplicateFieldMessage(
          duplicateFields.length > 0
            ? duplicateFields
            : ['Email, nomor telepon, NIB, NPWP, atau KTP']
        ),
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

module.exports = { registerSeller };
