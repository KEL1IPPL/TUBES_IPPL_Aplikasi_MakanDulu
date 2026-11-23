'use strict';

const Tesseract = require('tesseract.js');

const bacaTeks = async (buffer) => {
  const { data } = await Tesseract.recognize(buffer, 'ind', {
    // Tingkatkan akurasi angka dengan OEM LSTM + PSM Block
    tessedit_ocr_engine_mode: 1,
    tessedit_pageseg_mode: 6,
  });
  return data.text;
};

/**
 * Ekstrak NIK (Nomor Induk Kependudukan) dari teks OCR KTP.
 * Format: 16 digit angka berurutan (kadang dengan spasi di setiap 4 digit).
 * @param {string} teks
 * @returns {string|null}
 */
const ekstrakNIK = (teks) => {
  // Hapus semua karakter non-digit, lalu cari blok 16 digit
  const tanpaSpasi = teks.replace(/\s/g, '');
  const cocok = tanpaSpasi.match(/\b\d{16}\b/);
  if (cocok) return cocok[0];

  // Fallback: gabungkan kelompok angka terdekat hingga 16 digit
  const semuaAngka = teks.match(/\d+/g);
  if (!semuaAngka) return null;
  const gabungan = semuaAngka.join('');
  const blok = gabungan.match(/\d{16}/);
  return blok ? blok[0] : null;
};

/**
 * Ekstrak nomor NPWP dari teks OCR.
 * Format resmi: XX.XXX.XXX.X-XXX.XXX (15 digit, bisa berformat atau polos).
 * @param {string} teks
 * @returns {string|null}
 */
const ekstrakNPWP = (teks) => {
  // Format dengan titik dan strip
  const formatResmi = teks.match(/\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}/);
  if (formatResmi) return formatResmi[0];

  // Format 15 digit tanpa pemisah
  const tanpaSpasi = teks.replace(/\s/g, '');
  const polos = tanpaSpasi.match(/\b\d{15}\b/);
  if (polos) return polos[0];

  // Fallback: gabungkan angka-angka dan ambil 15 digit pertama
  const semuaAngka = teks.match(/\d+/g);
  if (!semuaAngka) return null;
  const gabungan = semuaAngka.join('');
  const blok = gabungan.match(/\d{15}/);
  return blok ? blok[0] : null;
};

/**
 * Ekstrak Nomor Izin Berusaha (NIB) dari teks OCR.
 * Format: 13 digit angka.
 * @param {string} teks
 * @returns {string|null}
 */
const ekstrakNIB = (teks) => {
  const tanpaSpasi = teks.replace(/\s/g, '');
  const cocok = tanpaSpasi.match(/\b\d{13}\b/);
  if (cocok) return cocok[0];

  const semuaAngka = teks.match(/\d+/g);
  if (!semuaAngka) return null;
  const gabungan = semuaAngka.join('');
  const blok = gabungan.match(/\d{13}/);
  return blok ? blok[0] : null;
};

const bacaKTP = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File KTP wajib diunggah.' });
    }

    const teksOCR = await bacaTeks(req.file.buffer);
    const nik = ekstrakNIK(teksOCR);

    if (!nik) {
      return res.status(422).json({
        success: false,
        message: 'NIK tidak ditemukan di foto KTP. Pastikan foto jelas dan tidak buram.',
        teksOCR, // bantu debug di development
      });
    }

    return res.json({ success: true, nik });
  } catch (error) {
    console.error('[bacaKTP] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses foto KTP.' });
  }
};

const bacaNPWP = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File NPWP wajib diunggah.' });
    }

    const teksOCR = await bacaTeks(req.file.buffer);
    const npwp = ekstrakNPWP(teksOCR);

    if (!npwp) {
      return res.status(422).json({
        success: false,
        message: 'Nomor NPWP tidak ditemukan di foto. Pastikan foto jelas.',
        teksOCR,
      });
    }

    return res.json({ success: true, npwp });
  } catch (error) {
    console.error('[bacaNPWP] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses foto NPWP.' });
  }
};

const bacaNIB = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File NIB wajib diunggah.' });
    }

    const teksOCR = await bacaTeks(req.file.buffer);
    const nib = ekstrakNIB(teksOCR);

    if (!nib) {
      return res.status(422).json({
        success: false,
        message: 'Nomor Izin Berusaha (NIB) tidak ditemukan di foto.',
        teksOCR,
      });
    }

    return res.json({ success: true, nib });
  } catch (error) {
    console.error('[bacaNIB] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses foto NIB.' });
  }
};

const bacaDokumenLegalitas = async (req, res) => {
  try {
    const berkas = req.files || {};
    const ktpFile   = berkas.ktpFile?.[0];
    const npwpFile  = berkas.npwpFile?.[0];
    const nibFile   = berkas.nibFile?.[0];

    if (!ktpFile || !npwpFile || !nibFile) {
      return res.status(400).json({
        success: false,
        message: 'Ketiga file legalitas (KTP, NPWP, NIB) wajib diunggah sekaligus.',
      });
    }

    // Jalankan OCR secara paralel agar lebih cepat
    const [teksKTP, teksNPWP, teksNIB] = await Promise.all([
      bacaTeks(ktpFile.buffer),
      bacaTeks(npwpFile.buffer),
      bacaTeks(nibFile.buffer),
    ]);

    const nik  = ekstrakNIK(teksKTP);
    const npwp = ekstrakNPWP(teksNPWP);
    const nib  = ekstrakNIB(teksNIB);

    // Kumpulkan dokumen yang gagal dibaca
    const gagal = [];
    if (!nik)  gagal.push('KTP (NIK tidak terdeteksi)');
    if (!npwp) gagal.push('NPWP (nomor NPWP tidak terdeteksi)');
    if (!nib)  gagal.push('NIB (nomor izin berusaha tidak terdeteksi)');

    if (gagal.length > 0) {
      return res.status(422).json({
        success: false,
        message: `Gagal membaca: ${gagal.join(', ')}. Pastikan foto jelas dan tidak buram.`,
        hasilParsial: { nik, npwp, nib }, // kirim hasil parsial agar user bisa isi manual
      });
    }

    // Semua berhasil — kembalikan ke frontend untuk diisi ke form registrasi
    return res.json({
      success: true,
      message: 'Semua dokumen legalitas berhasil dibaca.',
      data: { nik, npwp, nib },
    });
  } catch (error) {
    console.error('[bacaDokumenLegalitas] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membaca dokumen legalitas.',
    });
  }
};

module.exports = {
  bacaKTP,
  bacaNPWP,
  bacaNIB,
  bacaDokumenLegalitas,
};
