const express = require('express');
const router = express.Router();

const {
  getKatalogRekomendasi,
  getDetailMenu,
  searchKatalog,
  getDaftarToko,
} = require('../controller/katalog_controller');

// 1. Main Flow: proses_katalog(preferensi_pembeli) -> tampilkan_katalog_rekomendasi
router.get('/', getKatalogRekomendasi);

// 3 & 4. Alternative Flow #1 & #2: Pencarian / Filtering katalog
router.get('/search', searchKatalog);

// Daftar mitra resto dari database Penjual
router.get('/toko', getDaftarToko);

// 2. Flow Memilih Menu: tampilkan_detai_menu -> detail_menu
router.get('/menu/:idMenu', getDetailMenu);

module.exports = router;
