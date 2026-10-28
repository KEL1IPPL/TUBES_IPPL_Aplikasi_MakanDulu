const express = require('express');
const {
  registerBuyer,
  registerSeller,
  login,
} = require('../controllers/autentikasiperan');

const router = express.Router();

router.post('/register/pembeli', registerBuyer);
router.post('/register/penjual', registerSeller);
router.post('/login', login);

module.exports = router;
