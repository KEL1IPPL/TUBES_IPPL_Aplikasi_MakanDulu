const express = require('express');
const router = express.Router();

const { searchMenu } = require('../controller/pencarianMenu');
const {
  tambahMenu,
  getMenuPenjual,
  updateMenu,
  toggleStatusMenu,
  hapusMenu,
} = require('../controller/menu_controller');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');

router.get('/search', searchMenu);

router.get('/', autentikasiJWT, getMenuPenjual);
router.post('/', autentikasiJWT, tambahMenu);
router.put('/:idMenu', autentikasiJWT, updateMenu);
router.patch('/:idMenu/stok', autentikasiJWT, toggleStatusMenu);
router.delete('/:idMenu', autentikasiJWT, hapusMenu);

module.exports = router;