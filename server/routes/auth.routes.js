'use strict';

const router = require('express').Router();
const authController = require('../controllers/authController');
const validators = require('../utils/validators');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validators.register, authController.register);
router.post('/login', authLimiter, validators.login, authController.login);
router.post('/logout', authenticate, authController.logout);

router.post('/forgot-password', authLimiter, validators.forgotPassword, authController.forgotPassword);
router.post('/reset-password', authLimiter, validators.resetPassword, authController.resetPassword);
router.get('/verify-email/:token', validators.verifyEmail, authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);

router.post('/refresh', authController.refresh);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
