const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const { kirimEmailOtp } = require('../config/mailer');
const { isValidEmail } = require('../validation/registrasiPengguna');

const OTP_TTL_MS = 10 * 60 * 1000;
const resetRequests = new Map();

const normalizeRole = (role) =>
  role === 'Pembeli' || role === 'Penjual' ? role : null;

const getUserByEmail = async (email, role) => {
  const table = role === 'Pembeli' ? 'Pembeli' : 'Penjual';
  const idColumn = role === 'Pembeli' ? 'idPembeli' : 'idPenjual';
  const [rows] = await db.execute(
    `SELECT ${idColumn} AS id FROM ${table} WHERE email = ? LIMIT 1`,
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
    resetRequests.set(`${role}:${email}`, {
      otp,
      expiresAt: Date.now() + OTP_TTL_MS,
      verified: false,
      resetToken: null,
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

const verifyPasswordResetOtp = (req, res) => {
  const { email, role, kodeOtp } = req.body;
  if (!validateResetRequest({ email, role }) || !/^\d{6}$/.test(kodeOtp || '')) {
    return res.status(400).json({
      success: false,
      message: 'Email, peran, dan kode OTP 6 digit wajib diisi dengan valid.',
    });
  }

  const key = `${role}:${email.toLowerCase().trim()}`;
  const request = resetRequests.get(key);
  if (!request || request.expiresAt <= Date.now() || request.otp !== kodeOtp) {
    return res.status(400).json({
      success: false,
      message: 'Kode OTP tidak valid atau sudah kadaluarsa.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  request.verified = true;
  request.resetToken = resetToken;
  resetRequests.set(key, request);

  return res.status(200).json({
    success: true,
    message: 'OTP berhasil diverifikasi.',
    resetToken,
  });
};

const resetPassword = async (req, res) => {
  const { email, role, resetToken, newPassword } = req.body;
  if (
    !validateResetRequest({ email, role }) ||
    typeof resetToken !== 'string' ||
    !resetToken ||
    typeof newPassword !== 'string' ||
    newPassword.length < 8
  ) {
    return res.status(400).json({
      success: false,
      message: 'Email, peran, token reset, dan password baru minimal 8 karakter wajib diisi.',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const key = `${role}:${normalizedEmail}`;
  const request = resetRequests.get(key);
  if (
    !request ||
    !request.verified ||
    request.expiresAt <= Date.now() ||
    request.resetToken !== resetToken
  ) {
    return res.status(400).json({
      success: false,
      message: 'Sesi reset password tidak valid atau sudah kadaluarsa.',
    });
  }

  try {
    const user = await getUserByEmail(normalizedEmail, role);
    if (!user) {
      resetRequests.delete(key);
      return res.status(404).json({
        success: false,
        message: 'Email tidak lagi terdaftar pada akun tersebut.',
      });
    }

    const table = role === 'Pembeli' ? 'Pembeli' : 'Penjual';
    const idColumn = role === 'Pembeli' ? 'idPembeli' : 'idPenjual';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.execute(
      `UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`,
      [hashedPassword, user.id]
    );
    resetRequests.delete(key);

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diubah. Silakan login dengan password baru.',
    });
  } catch (error) {
    console.error('[resetPassword] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat mengubah password.',
    });
  }
};

module.exports = {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
};
