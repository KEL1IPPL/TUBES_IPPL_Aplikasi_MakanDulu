const express = require('express');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');
const {
  simpanPreferensiMakanan,
} = require('../controller/preferensi_makanan_controller');

const router = express.Router();

router.put('/', autentikasiJWT, simpanPreferensiMakanan);

module.exports = router;
