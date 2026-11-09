const express = require('express');
const { login } = require('../controller/loginPengguna');

const router = express.Router();

router.post('/', login);

module.exports = router;
