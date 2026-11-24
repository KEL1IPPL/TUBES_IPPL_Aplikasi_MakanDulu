const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { searchMenu } = require('../controller/pencarianMenu');
const {
  tambahMenu,
  getMenuPenjual,
  updateMenu,
  toggleStatusMenu,
  hapusMenu,
  uploadFotoMenu,
} = require('../controller/menu_controller');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');

// Konfigurasi Multer untuk penyimpanan file foto menu ke disk
const uploadDir = path.join(__dirname, '../../uploads/menu');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `menu-${uniqueSuffix}${ext}`);
  },
});

const uploadMenu = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Format file tidak didukung. Harap unggah gambar (JPG, PNG, atau WebP).'));
    }
    cb(null, true);
  },
});

// Rute unggah berkas foto menu (multipart/form-data)
router.post('/upload-foto', autentikasiJWT, uploadMenu.single('fotoMenu'), uploadFotoMenu);

router.get('/search', searchMenu);

router.get('/', autentikasiJWT, getMenuPenjual);
router.post('/', autentikasiJWT, tambahMenu);
router.put('/:idMenu', autentikasiJWT, updateMenu);
router.patch('/:idMenu/stok', autentikasiJWT, toggleStatusMenu);
router.delete('/:idMenu', autentikasiJWT, hapusMenu);

// Error handler khusus multer di rute menu
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  return res.status(500).json({ success: false, message: 'Gagal mengunggah berkas foto menu.' });
});

module.exports = router;