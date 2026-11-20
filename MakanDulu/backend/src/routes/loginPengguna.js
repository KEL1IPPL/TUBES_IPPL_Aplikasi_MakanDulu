const express = require('express');
const { login } = require('../controller/login_controller');

const router = express.Router();

router.post('/', login);

module.exports = router;
