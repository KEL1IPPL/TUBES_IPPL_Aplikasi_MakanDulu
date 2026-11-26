'use strict';

const express = require('express');
const router = express.Router();
const {
  konfirmasi_pesanan,
  getPesananPenjual,
  tandaiPesananDiantar,
  selesaikanPesananPembeli,
  simulasiWaktuHabis,
  getPesananAktifPembeli,
} = require('../controller/pesanan_controller');
const {
  getNotifikasiPengguna,
  tandaiNotifikasiDibaca,
} = require('../controller/notif_pesananan_controller');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');

const autentikasiOpsional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return autentikasiJWT(req, res, next);
  }
  next();
};

// Notifikasi pesanan (layanan_notifikasi -> Penjual & Pembeli)
router.get('/notifikasi', autentikasiOpsional, getNotifikasiPengguna);
router.patch('/notifikasi/baca', autentikasiOpsional, tandaiNotifikasiDibaca);

// Pesanan masuk milik Penjual (hanya COD & Non-COD yang pembayarannya sudah lunas)
router.get('/penjual', autentikasiOpsional, getPesananPenjual);

// Pesanan aktif milik Pembeli
router.get('/pembeli/aktif', autentikasiOpsional, getPesananAktifPembeli);

// Main Flow: konfirmasi_pesanan(idPesanan) -> status "Sedang Disiapkan" + stop_timer + notifikasi
router.post('/:idPesanan/konfirmasi', autentikasiOpsional, konfirmasi_pesanan);
router.patch('/:idPesanan/konfirmasi', autentikasiOpsional, konfirmasi_pesanan);

// Makanan siap diantar kurir -> status "Pesanan Diantar"
router.post('/:idPesanan/siap-diantar', autentikasiOpsional, tandaiPesananDiantar);

// Pembeli konfirmasi diterima -> status "Pesanan Selesai" (atau tolak COD)
router.post('/:idPesanan/selesai', autentikasiOpsional, selesaikanPesananPembeli);

// Simulasi Alternative Flow #1 Auto Cancel (timer_controller -> Waktu habis)
router.post('/:idPesanan/simulasi-waktu-habis', autentikasiOpsional, simulasiWaktuHabis);

module.exports = router;
