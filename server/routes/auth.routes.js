'use strict';

const router = require('express').Router();
const authController = require('../controllers/authController');
const validators = require('../utils/validators');
const { authenticate } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const passport = require('passport');

router.post('/register', authLimiter, validators.register, authController.register);
router.post('/login', authLimiter, validators.login, authController.login);
router.post('/logout', authenticate, authController.logout);

// Google OAuth
router.get('/google', authLimiter, passport.authenticate('google', { scope: ['openid', 'email', 'profile'] }));
router.get(
  '/google/callback',
  authLimiter,
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback
);

// OTP email verification (pre-signup, no auth token yet)
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/resend-otp', authLimiter, authController.resendOtp);

router.post('/forgot-password', authLimiter, validators.forgotPassword, authController.forgotPassword);
router.post('/verify-reset-otp', authLimiter, validators.verifyResetOtp, authController.verifyResetOtp);
router.post('/reset-password', authLimiter, validators.resetPassword, authController.resetPassword);
router.get('/verify-email/:token', validators.verifyEmail, authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);

router.post('/refresh', authController.refresh);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
