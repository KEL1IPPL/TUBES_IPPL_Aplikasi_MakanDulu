const express = require('express');
const registrasiPengguna = require('./registrasiPengguna');
const loginPengguna = require('./loginPengguna');
const passwordReset = require('./passwordReset');
const { autentikasiJWT } = require('../middleware/autentikasiJWT');
const { getProfile } = require('../controller/login_controller');

const router = express.Router();

router.use('/register', registrasiPengguna);
router.use('/login', loginPengguna);
router.use('/password-reset', passwordReset);
router.get('/me', autentikasiJWT, getProfile);
router.get('/profil', autentikasiJWT, getProfile);

module.exports = router;
