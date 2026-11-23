const express = require('express');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');
const {
  simpanPreferensiMakanan,
  lewatiPreferensiMakanan,
} = require('../controller/preferensi_makanan_controller');

const router = express.Router();

// Main Flow: Pembeli -> klik simpan dan lanjut -> simpan preferensi makanan -> simpan data
router.put('/', autentikasiJWT, simpanPreferensiMakanan);
router.post('/', autentikasiJWT, simpanPreferensiMakanan);

// Alternative Flow: Pembeli -> klik tombol "Lewati" -> lewati pemilihan preferensi makanan
router.post('/lewati', autentikasiJWT, lewatiPreferensiMakanan);

module.exports = router;
