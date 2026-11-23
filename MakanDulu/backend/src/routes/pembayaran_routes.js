'use strict';

const express = require('express');
const router = express.Router();
const {
  notifikasiMidtrans,
  konfirmasiPembayaranSelesai,
  getStatusPesanan,
} = require('../controller/pemesanan_controller');

// POST /api/pembayaran/notifikasi -> Webhook HTTP POST dari Midtrans
router.post('/notifikasi', notifikasiMidtrans);

// POST /api/pembayaran/selesai/:idPesanan -> Konfirmasi pembayaran sukses dari Snap Frontend
router.post('/selesai/:idPesanan', konfirmasiPembayaranSelesai);

// GET /api/pembayaran/status/:idPesanan -> Cek status pembayaran terkini
router.get('/status/:idPesanan', getStatusPesanan);

module.exports = router;
