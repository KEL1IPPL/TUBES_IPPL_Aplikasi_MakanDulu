const express = require('express');
const router = express.Router();

const { searchMenu } = require('../controller/pencarianMenu');

router.get('/search', searchMenu);

module.exports = router;