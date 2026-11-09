const express = require('express');
const registrasiPengguna = require('./registrasiPengguna');
const loginPengguna = require('./loginPengguna');
const passwordReset = require('./passwordReset');

const router = express.Router();

router.use('/register', registrasiPengguna);
router.use('/login', loginPengguna);
router.use('/password-reset', passwordReset);

module.exports = router;
