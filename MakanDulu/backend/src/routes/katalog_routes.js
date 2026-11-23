const express = require('express');
const router = express.Router();

const {
  getKatalogRekomendasi,
  getDetailMenu,
  searchKatalog,
  getDaftarToko,
  masukanItemKeKeranjang,
} = require('../controller/katalog_controller');

// 1. Main Flow Sequence Diagram:
// Pembeli -> halaman_dashboard_pembeli -> katalog_controller: tampilkan menu
// ambil preferensi makanan -> ambil menu berdasarkan preferensi -> tampilkan menu
router.get('/', getKatalogRekomendasi);

// 3 & 4. Alternative Flow #1 & #2: Pencarian / Filtering katalog
router.get('/search', searchKatalog);

// Daftar mitra resto dari database Penjual
router.get('/toko', getDaftarToko);

// 2. Flow Memilih Menu:
// Pembeli -> halaman_dashboard_pembeli: pilih menu -> tampilkan detail menu -> Menu: ambil data detail menu -> detail menu -> halaman_detail_menu: tampilkan detail menu
router.get('/menu/:idMenu', getDetailMenu);

// 3. Flow Tambahkan ke Keranjang:
// Pembeli -> halaman_detail_menu: klik tambahkan ke keranjang -> masukan item ke keranjang -> Menu: cek stok item -> tersedia -> Keranjang: tambahkan item -> item ditambahkan -> tampilkan pesan "Menu telah ditambahkan ke keranjang"
router.post('/keranjang', masukanItemKeKeranjang);
router.post('/menu/:idMenu/keranjang', masukanItemKeKeranjang);

module.exports = router;
