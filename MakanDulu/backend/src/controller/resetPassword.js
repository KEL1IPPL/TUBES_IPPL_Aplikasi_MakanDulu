const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/db');
const {
  validateResetRequest,
  getUserByEmail,
} = require('./otp');
const {
  getResetRequest,
  saveResetRequest,
  deleteResetRequest,
} = require('../services/resetPasswordStore');

const verifyPasswordResetOtp = (req, res) => {
  const { email, role, kodeOtp } = req.body;
  if (!validateResetRequest({ email, role }) || !/^\d{6}$/.test(kodeOtp || '')) {
    return res.status(400).json({
      success: false,
      message: 'Email, peran, dan kode OTP 6 digit wajib diisi dengan valid.',
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const request = getResetRequest(normalizedEmail, role);
  if (!request || request.expiresAt <= Date.now() || request.otp !== kodeOtp) {
    return res.status(400).json({
      success: false,
      message: 'Kode OTP tidak valid atau sudah kadaluarsa.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  saveResetRequest(normalizedEmail, role, {
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
  const request = getResetRequest(normalizedEmail, role);
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
      deleteResetRequest(normalizedEmail, role);
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
    deleteResetRequest(normalizedEmail, role);

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

module.exports = { verifyPasswordResetOtp, resetPassword };
