'use strict';

const express = require('express');
const router = express.Router();
const {
  kirimUlasan,
  getUlasanByPesanan,
  getUlasanByToko,
} = require('../controller/ulasan_controller');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');

// Middleware opsional autentikasi
const autentikasiOpsional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return autentikasiJWT(req, res, next);
  }
  next();
};

// POST /api/ulasan -> Kirim ulasan dan rating pesanan (Langkah 3-5 use case)
router.post('/', autentikasiOpsional, kirimUlasan);

// GET /api/ulasan/pesanan/:idPesanan -> Cek apakah pesanan sudah diulas
router.get('/pesanan/:idPesanan', autentikasiOpsional, getUlasanByPesanan);

// GET /api/ulasan/toko/:idPenjual -> Daftar ulasan toko
router.get('/toko/:idPenjual', getUlasanByToko);

module.exports = router;
