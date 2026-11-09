class LayananOtpService {
  static sessionOtpVendor = new Map();
  static async kirimKodeOtp(targetIdentifier) {
    const kodeOtp = String(Math.floor(100000 + Math.random() * 900000));

    this.sessionOtpVendor.set(targetIdentifier.toLowerCase().trim(), {
      kode: kodeOtp,
      expiredAt: Date.now() + 10 * 60 * 1000,
      attempts: 0
    });
    console.log(`\n======================================================`);
    console.log(`[EXTERNAL SERVICE: Layanan_OTP]`);
    console.log(`Penerima  : ${targetIdentifier}`);
    console.log(`Kode OTP  : ${kodeOtp}`);
    console.log(`Berlaku   : 10 Menit`);
    console.log(`======================================================\n`);
    return {
      success: true,
      status: 'DELIVERED',
      message: 'Kode OTP telah dikirim oleh Layanan_OTP'
    };
  }
  static async verifikasiKodeOtp(targetIdentifier, inputKode) {
    const data = this.sessionOtpVendor.get(targetIdentifier.toLowerCase().trim());
    if (!data) {
      return { valid: false, message: 'Kode OTP tidak ditemukan atau belum diminta.' };
    }
    if (Date.now() > data.expiredAt) {
      this.sessionOtpVendor.delete(targetIdentifier.toLowerCase().trim());
      return { valid: false, message: 'Kode tidak valid atau sudah kedaluwarsa.' };
    }
    if (data.kode !== String(inputKode).trim()) {
      return { valid: false, message: 'Kode OTP yang dimasukkan salah.' };
    }
    this.sessionOtpVendor.delete(targetIdentifier.toLowerCase().trim());
    return { valid: true, message: 'Kode OTP valid.' };
  }
}
module.exports = LayananOtpService;