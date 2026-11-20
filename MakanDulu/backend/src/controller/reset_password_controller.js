const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const { kirimEmailOtp } = require('../services/mailtrap');
const inMemoryResetRequests = new Map();

const validateResetRequest = ({ email, role }) =>
  typeof email === 'string' &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
  (role === 'Pembeli' || role === 'Penjual');

const getResetKey = (email, role) => `${role}:${email.toLowerCase().trim()}`;

const getUserByEmail = async (email, role) => {
  const table = role === 'Pembeli' ? 'Pembeli' : 'Penjual';
  const idColumn = role === 'Pembeli' ? 'idPembeli' : 'idPenjual';
  const [rows] = await db.execute(
    `SELECT ${idColumn} AS id, password FROM ${table} WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
};

const requestPasswordReset = async (req, res) => {
  const { email, role } = req.body || {};
  if (!validateResetRequest({ email, role })) {
    return res.status(400).json({
      success: false,
      message: 'Email dan peran (Pembeli/Penjual) wajib diisi dengan valid.',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  try {
    const user = await getUserByEmail(normalizedEmail, role);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Email belum terdaftar sebagai akun ${role}.`,
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    const resetKey = getResetKey(normalizedEmail, role);
    inMemoryResetRequests.set(resetKey, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      verified: false,
    });

    await kirimEmailOtp(normalizedEmail, otp, 'reset_password');

    return res.status(200).json({
      success: true,
      message: 'Kode OTP reset password telah dikirim melalui email.',
    });
  } catch (error) {
    console.error('[requestPasswordReset] Error:', error);
    return res.status(502).json({
      success: false,
      message: 'Kode OTP gagal dikirim. Periksa konfigurasi Mailtrap atau coba kembali.',
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

  const normalizedEmail = email.toLowerCase().trim();
  const resetKey = getResetKey(normalizedEmail, role);
  const request = inMemoryResetRequests.get(resetKey);
  if (!request || request.expiresAt <= Date.now() || request.otp !== kodeOtp) {
    return res.status(400).json({
      success: false,
      message: 'Kode OTP tidak valid atau sudah kadaluarsa.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  inMemoryResetRequests.set(resetKey, {
    ...request,
    verified: true,
    resetToken,
  });

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
  const resetKey = getResetKey(normalizedEmail, role);
  const request = inMemoryResetRequests.get(resetKey);
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
      inMemoryResetRequests.delete(resetKey);
      return res.status(404).json({
        success: false,
        message: 'Email tidak lagi terdaftar pada akun tersebut.',
      });
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({
        success: false,
        message: 'Password baru tidak boleh sama dengan password yang sedang digunakan.',
      });
    }

    const table = role === 'Pembeli' ? 'Pembeli' : 'Penjual';
    const idColumn = role === 'Pembeli' ? 'idPembeli' : 'idPenjual';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.execute(
      `UPDATE ${table} SET password = ? WHERE ${idColumn} = ?`,
      [hashedPassword, user.id]
    );
    inMemoryResetRequests.delete(resetKey);

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

module.exports = { requestPasswordReset, verifyPasswordResetOtp, resetPassword };
