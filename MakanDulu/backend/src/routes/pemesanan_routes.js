'use strict';

const express = require('express');
const router = express.Router();
const {
  buatPesanan,
  getStatusPesanan,
  getRiwayatPesanan,
} = require('../controller/pemesanan_controller');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');

// Helper middleware opsional jika token ada
const autentikasiOpsional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return autentikasiJWT(req, res, next);
  }
  next();
};

// POST /api/pemesanan -> Buat pesanan & inisialisasi Midtrans Snap
router.post('/', autentikasiOpsional, buatPesanan);

// GET /api/pemesanan/riwayat -> Ambil riwayat pesanan pembeli
router.get('/riwayat', autentikasiOpsional, getRiwayatPesanan);

// GET /api/pemesanan/:idPesanan -> Cek status pesanan & detail item
router.get('/:idPesanan', autentikasiOpsional, getStatusPesanan);

module.exports = router;
