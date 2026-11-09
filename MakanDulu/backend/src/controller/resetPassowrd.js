const LayananOtpService = require('../services/layananOtpService');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const requestResetPasswordOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email wajib diisi.' });
  }

  const emailBersih = email.toLowerCase().trim();

  const [cekPembeli] = await db.execute('SELECT idPembeli FROM Pembeli WHERE email = ?', [emailBersih]);
  const [cekPenjual] = await db.execute('SELECT idPenjual FROM Penjual WHERE email = ?', [emailBersih]);

  if (cekPembeli.length === 0 && cekPenjual.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Akun tidak ditemukan, periksa kembali email anda.' // Persis kata-kata SKPL Hal 28
    });
  }

  await LayananOtpService.kirimKodeOtp(emailBersih);

  return res.status(200).json({
    success: true,
    message: 'Kode OTP reset password telah dikirim ke email terdaftar.'
  });
};

const executeResetPassword = async (req, res) => {
  const { email, kodeOtp, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Kata sandi tidak sesuai.' 
    });
  }

  const hasilOtp = await LayananOtpService.verifikasiKodeOtp(email, kodeOtp);
  if (!hasilOtp.valid) {
    return res.status(400).json({
      success: false,
      message: hasilOtp.message 
    });
  }

  const emailBersih = email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.execute('UPDATE Pembeli SET password = ? WHERE email = ?', [hashedPassword, emailBersih]);
  await db.execute('UPDATE Penjual SET password = ? WHERE email = ?', [hashedPassword, emailBersih]);

  return res.status(200).json({
    success: true,
    message: 'Kata sandi berhasil diubah.'
  });
};