const express = require('express');
const multer = require('multer');
const { registerBuyer, registerSeller } = require('../controller/registrasiPengguna');
const { uploadLegalitas } = require('../middleware/uploadLegalitas');

const router = express.Router();

router.post('/pembeli', registerBuyer);
router.post('/penjual', (req, res, next) => {
  uploadLegalitas.fields([
    { name: 'nibFile', maxCount: 1 },
    { name: 'ktpFile', maxCount: 1 },
    { name: 'npwpFile', maxCount: 1 },
  ])(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran setiap berkas legalitas maksimal 2 MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Berkas legalitas tidak valid.',
    });
  });
}, registerSeller);

module.exports = router;
