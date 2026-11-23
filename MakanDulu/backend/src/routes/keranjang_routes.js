'use strict';

const express = require('express');
const router = express.Router();
const {
  getKeranjang,
  tambahItemKeranjang,
  hapusItemKeranjang,
  kosongkanKeranjang,
} = require('../controller/keranjang_controller');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');

const autentikasiOpsional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return autentikasiJWT(req, res, next);
  }
  next();
};

// GET /api/keranjang -> Minta isi keranjang (Langkah 2–5)
router.get('/', autentikasiOpsional, getKeranjang);

// POST /api/keranjang -> Tambah/Update item ke keranjang
router.post('/', autentikasiOpsional, tambahItemKeranjang);

// DELETE /api/keranjang/:idItemKeranjang -> Hapus satu item
router.delete('/:idItemKeranjang', autentikasiOpsional, hapusItemKeranjang);

// DELETE /api/keranjang -> Kosongkan keranjang
router.delete('/', autentikasiOpsional, kosongkanKeranjang);

module.exports = router;
