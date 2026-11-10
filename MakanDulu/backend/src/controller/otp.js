const crypto = require('crypto');
const db = require('../config/db');
const { kirimEmailOtp } = require('../config/mailer');
const { isValidEmail } = require('../validation/registrasiPengguna');
const { saveResetRequest } = require('../services/resetPasswordStore');

const OTP_TTL_MS = 10 * 60 * 1000;
const normalizeRole = (role) =>
  role === 'Pembeli' || role === 'Penjual' ? role : null;

const getUserByEmail = async (email, role) => {
  const table = role === 'Pembeli' ? 'Pembeli' : 'Penjual';
  const idColumn = role === 'Pembeli' ? 'idPembeli' : 'idPenjual';
  const [rows] = await db.execute(
    `SELECT ${idColumn} AS id, password FROM ${table} WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const validateResetRequest = (body) => {
  const role = normalizeRole(body.role);
  return role && isValidEmail(body.email);
};

const requestPasswordReset = async (req, res) => {
  if (!validateResetRequest(req.body)) {
    return res.status(400).json({
      success: false,
      message: 'Email dan peran akun (Pembeli/Penjual) wajib diisi dengan valid.',
    });
  }

  const email = req.body.email.toLowerCase().trim();
  const role = req.body.role;

  try {
    const user = await getUserByEmail(email, role);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email tersebut tidak terdaftar pada akun yang dipilih.',
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    saveResetRequest(email, role, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    await kirimEmailOtp(email, otp, 'reset_password');
    return res.status(200).json({
      success: true,
      message: `Kode OTP telah dikirim ke ${email}. Berlaku 10 menit.`,
    });
  } catch (error) {
    console.error('[requestPasswordReset] Error:', {
      name: error.name,
      code: error.code,
      responseCode: error.responseCode,
      command: error.command,
      response: error.response,
      message: error.message,
    });
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim OTP. Periksa konfigurasi email server.',
    });
  }
};

module.exports = {
  requestPasswordReset,
  validateResetRequest,
  getUserByEmail,
};
