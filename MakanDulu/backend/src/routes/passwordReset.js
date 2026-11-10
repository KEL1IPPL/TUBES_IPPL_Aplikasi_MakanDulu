const express = require('express');
const {
  requestPasswordReset,
} = require('../controller/otp');
const {
  verifyPasswordResetOtp,
  resetPassword,
} = require('../controller/resetPassword');

const router = express.Router();

router.post('/request', requestPasswordReset);
router.post('/verify', verifyPasswordResetOtp);
router.post('/reset', resetPassword);

module.exports = router;
