const express = require('express');
const {
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
} = require('../controller/otp');

const router = express.Router();

router.post('/request', requestPasswordReset);
router.post('/verify', verifyPasswordResetOtp);
router.post('/reset', resetPassword);

module.exports = router;
