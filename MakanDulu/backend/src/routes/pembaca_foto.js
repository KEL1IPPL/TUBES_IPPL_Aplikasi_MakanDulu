'use strict';

const express = require('express');
const multer  = require('multer');

const router = express.Router();

const {
  bacaKTP,
  bacaNPWP,
  bacaNIB,
  bacaDokumenLegalitas,
} = require('../controller/pembaca_foto_controller'); // path benar: tanpa 's'

// ---------------------------------------------------------------------------
// Konfigurasi multer — simpan di memori (buffer), tidak perlu tulis disk
// ---------------------------------------------------------------------------
const uploadMemori = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 5 MB per file
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP.'));
    }
    cb(null, true);
  },
});

// ---------------------------------------------------------------------------
// Rute individual (satu dokumen per request)
// ---------------------------------------------------------------------------

// POST /api/dokumen/baca/ktp   → field "ktp"
router.post('/baca/ktp',  uploadMemori.single('ktp'),  bacaKTP);

// POST /api/dokumen/baca/npwp  → field "npwp"
router.post('/baca/npwp', uploadMemori.single('npwp'), bacaNPWP);

// POST /api/dokumen/baca/nib   → field "nib"
router.post('/baca/nib',  uploadMemori.single('nib'),  bacaNIB);


router.post(
  '/baca/legalitas',
  uploadMemori.fields([
    { name: 'ktpFile',  maxCount: 1 },
    { name: 'npwpFile', maxCount: 1 },
    { name: 'nibFile',  maxCount: 1 },
  ]),
  bacaDokumenLegalitas,
);


// Error handler multer (ukuran / format file)
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: 'Kesalahan server pada upload dokumen.' });
});

module.exports = router;
