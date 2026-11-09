const express = require('express');
const { registerBuyer, registerSeller } = require('../controller/registrasiPengguna');

const router = express.Router();

router.post('/pembeli', registerBuyer);
router.post('/penjual', registerSeller);

module.exports = router;
