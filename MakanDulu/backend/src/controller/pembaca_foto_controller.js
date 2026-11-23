'use strict';

const Tesseract = require('tesseract.js');

/**
 * Normalisasi karakter visual OCR yang sering tertukar antara huruf dan angka
 * pada dokumen resmi Indonesia (e-KTP, NPWP, NIB).
 */
const cleanDigitConfusion = (str) => {
  if (!str) return '';
  return str
    .replace(/[OoD]/g, '0')
    .replace(/[Il|!L]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[E]/g, '3')
    .replace(/[A]/g, '4')
    .replace(/[Ss]/g, '5')
    .replace(/[bG]/g, '6')
    .replace(/[T]/g, '7')
    .replace(/[B]/g, '8')
    .replace(/[gq]/g, '9');
};

const bacaTeks = async (buffer) => {
  // Gunakan LSTM recognition tanpa membatasi layout kaku (mode otomatis)
  const { data } = await Tesseract.recognize(buffer, 'ind', {
    tessedit_ocr_engine_mode: 1,
  });
  return data.text || '';
};

/**
 * Ekstrak NIK (Nomor Induk Kependudukan) dari teks OCR KTP.
 * NIK Indonesia: tepat 16 digit angka, diawali 2 digit kode provinsi (11 s/d 94).
 * Contoh format KTP: "NIK : 3204281508950001"
 * @param {string} teks
 * @returns {string|null}
 */
const ekstrakNIK = (teks) => {
  if (!teks || typeof teks !== 'string') return null;

  // 1. Prioritas Utama: Cari baris/frasa yang memuat label 'NIK' (atau variasi OCR seperti N1K, NI K, N!K)
  const polaNIK = /(?:N\s*[I1l!|]\s*K|N\s*I\s*K)[^:\d\nA-Za-z]*[:;=\s.-]*([0-9A-Za-z\s|!.:/-]{12,35})/i;
  const matchNIK = teks.match(polaNIK);

  if (matchNIK) {
    const rawKandidat = matchNIK[1];
    const cleaned = cleanDigitConfusion(rawKandidat).replace(/\D/g, '');
    if (cleaned.length >= 16) {
      const nik = cleaned.substring(0, 16);
      const prov = parseInt(nik.substring(0, 2), 10);
      if (prov >= 11 && prov <= 94) {
        return nik;
      }
      return nik;
    }
    if (cleaned.length >= 12) {
      return cleaned;
    }
  }

  const baris = teks.split('\n');
  for (const b of baris) {
    if (/nama|alamat|agama|status|pekerjaan|kawin|lahir|gol\.?\s*darah/i.test(b)) {
      continue;
    }
    const bClean = cleanDigitConfusion(b).replace(/\D/g, '');
    const match16 = bClean.match(/[1-9]\d{15}/);
    if (match16) {
      const prov = parseInt(match16[0].substring(0, 2), 10);
      if (prov >= 11 && prov <= 94) {
        return match16[0];
      }
    }
  }

  // 3. Prioritas Ketiga: Cari blok 16 digit murni tanpa penggabungan liar
  const tanpaSpasi = teks.replace(/\s/g, '');
  const matchBlok = tanpaSpasi.match(/[1-9]\d{15}/);
  if (matchBlok) {
    return matchBlok[0];
  }

  return null;
};

/**
 * Ekstrak nomor NPWP dari teks OCR.
 * NPWP Indonesia: 15 digit (atau 16 digit format NIK).
 * Format standar: XX.XXX.XXX.X-XXX.XXX
 * @param {string} teks
 * @returns {string|null}
 */
const ekstrakNPWP = (teks) => {
  if (!teks || typeof teks !== 'string') return null;

  // 1. Format resmi dengan tanda baca titik dan strip
  const formatResmi = teks.match(/\d{2}\.\d{3}\.\d{3}\.\d-\d{3}\.\d{3}/);
  if (formatResmi) return formatResmi[0];

  // 2. Cari baris yang diawali kata kunci NPWP atau PAJAK
  const polaNPWP = /(?:NPWP|PAJAK)[^:\d\nA-Za-z]*[:;=\s.-]*([0-9A-Za-z\s|!.:/-]{12,30})/i;
  const matchNPWP = teks.match(polaNPWP);
  if (matchNPWP) {
    const cleaned = cleanDigitConfusion(matchNPWP[1]).replace(/\D/g, '');
    if (cleaned.length >= 15) {
      return cleaned.substring(0, 15);
    }
  }

  // 3. Format 15 digit atau 16 digit polos
  const tanpaSpasi = teks.replace(/\s/g, '');
  const polos15 = tanpaSpasi.match(/\b\d{15}\b/);
  if (polos15) return polos15[0];

  const polos16 = tanpaSpasi.match(/\b\d{16}\b/);
  if (polos16) return polos16[0];

  return null;
};

/**
 * Ekstrak Nomor Izin Berusaha (NIB) dari teks OCR.
 * Format: 13 digit angka.
 * @param {string} teks
 * @returns {string|null}
 */
const ekstrakNIB = (teks) => {
  if (!teks || typeof teks !== 'string') return null;

  // 1. Cari setelah kata kunci NIB atau IZIN BERUSAHA
  const polaNIB = /(?:NIB|NOMOR\s*INDUK\s*BERUSAHA|IZIN\s*BERUSAHA)[^:\d\nA-Za-z]*[:;=\s.-]*([0-9A-Za-z\s|!.:/-]{10,25})/i;
  const matchNIB = teks.match(polaNIB);
  if (matchNIB) {
    const cleaned = cleanDigitConfusion(matchNIB[1]).replace(/\D/g, '');
    if (cleaned.length >= 13) {
      return cleaned.substring(0, 13);
    }
  }

  // 2. Format 13 digit polos
  const tanpaSpasi = teks.replace(/\s/g, '');
  const cocok13 = tanpaSpasi.match(/\b\d{13}\b/);
  if (cocok13) return cocok13[0];

  return null;
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
        message: 'NIK tidak terbaca jelas di foto KTP. Pastikan posisi foto tegak lurus, pencahayaan cukup, dan tidak silau.',
        teksOCR,
      });
    }

    return res.json({ success: true, nik });
  } catch (error) {
    console.error('[bacaKTP] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses foto KTP: ' + error.message });
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
        message: 'Nomor NPWP tidak terdeteksi di foto. Pastikan foto jelas.',
        teksOCR,
      });
    }

    return res.json({ success: true, npwp });
  } catch (error) {
    console.error('[bacaNPWP] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses foto NPWP: ' + error.message });
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
        message: 'Nomor Izin Berusaha (NIB) tidak terdeteksi di foto.',
        teksOCR,
      });
    }

    return res.json({ success: true, nib });
  } catch (error) {
    console.error('[bacaNIB] Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses foto NIB: ' + error.message });
  }
};

const bacaDokumenLegalitas = async (req, res) => {
  try {
    const berkas = req.files || {};
    const ktpFile   = berkas.ktpFile?.[0];
    const npwpFile  = berkas.npwpFile?.[0];
    const nibFile   = berkas.nibFile?.[0];

    if (!ktpFile && !npwpFile && !nibFile) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu berkas legalitas (KTP, NPWP, atau NIB) wajib diunggah.',
      });
    }

    // Jalankan OCR secara paralel untuk file yang diunggah
    const tasks = [];
    if (ktpFile) {
      tasks.push(bacaTeks(ktpFile.buffer).then(teks => ({ tipe: 'ktp', hasil: ekstrakNIK(teks), teks })));
    } else {
      tasks.push(Promise.resolve({ tipe: 'ktp', hasil: null, teks: '' }));
    }

    if (npwpFile) {
      tasks.push(bacaTeks(npwpFile.buffer).then(teks => ({ tipe: 'npwp', hasil: ekstrakNPWP(teks), teks })));
    } else {
      tasks.push(Promise.resolve({ tipe: 'npwp', hasil: null, teks: '' }));
    }

    if (nibFile) {
      tasks.push(bacaTeks(nibFile.buffer).then(teks => ({ tipe: 'nib', hasil: ekstrakNIB(teks), teks })));
    } else {
      tasks.push(Promise.resolve({ tipe: 'nib', hasil: null, teks: '' }));
    }

    const [resKTP, resNPWP, resNIB] = await Promise.all(tasks);
    const nik  = resKTP.hasil;
    const npwp = resNPWP.hasil;
    const nib  = resNIB.hasil;

    const berhasil = [];
    const gagal = [];

    if (ktpFile) {
      if (nik) berhasil.push('KTP');
      else gagal.push('KTP (NIK tidak terbaca)');
    }
    if (npwpFile) {
      if (npwp) berhasil.push('NPWP');
      else gagal.push('NPWP (nomor NPWP tidak terbaca)');
    }
    if (nibFile) {
      if (nib) berhasil.push('NIB');
      else gagal.push('NIB (nomor NIB tidak terbaca)');
    }

    // Jika ada yang berhasil terbaca, kembalikan data yang sukses diekstrak
    if (berhasil.length > 0) {
      const pesan = gagal.length > 0
        ? `Dokumen ${berhasil.join(', ')} berhasil dibaca. Silakan cek atau lengkapi ${gagal.join(', ')} secara manual.`
        : 'Semua dokumen legalitas berhasil dibaca otomatis.';

      return res.json({
        success: true,
        message: pesan,
        data: {
          nik: nik || '',
          npwp: npwp || '',
          nib: nib || '',
        },
        hasilParsial: { nik, npwp, nib },
      });
    }

    // Jika ketiga dokumen gagal terbaca
    return res.status(422).json({
      success: false,
      message: 'Karakter pada dokumen tidak terbaca jelas. Pastikan foto tegak, pencahayaan terang, dan tidak buram/silau.',
      hasilParsial: { nik: null, npwp: null, nib: null },
    });
  } catch (error) {
    console.error('[bacaDokumenLegalitas] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membaca dokumen legalitas: ' + (error.message || ''),
    });
  }
};

module.exports = {
  bacaKTP,
  bacaNPWP,
  bacaNIB,
  bacaDokumenLegalitas,
  ekstrakNIK,
  ekstrakNPWP,
  ekstrakNIB,
};
