const asyncHandler = require('../utils/asyncHandler');
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', asyncHandler(authController.registerUser));
router.post('/login', asyncHandler(authController.LoginUser));
router.post('/logout', asyncHandler(authController.logoutUser));
router.post('/verify-otp', asyncHandler(authController.verifyOTP));

module.exports = router;