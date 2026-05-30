'use strict';

const authService = require('../services/authService');
const { success, asyncHandler } = require('../utils/response');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return success(res, 201, result, 'Account created. Verification email sent.');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return success(res, 200, result, 'Login successful.');
});

const logout = asyncHandler(async (_req, res) => {
  // JWT is stateless. Client deletes token.
  return success(res, 200, null, 'Logged out.');
});

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.params.token);
  return success(res, 200, user, 'Email verified successfully.');
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user.id);
  return success(res, 200, null, 'Verification email resent.');
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return success(res, 200, null, 'If an account exists, a reset email was sent.');
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.password);
  return success(res, 200, null, 'Password reset successfully.');
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'refreshToken required.' });
  }
  const result = await authService.refreshAccessToken(refreshToken);
  return success(res, 200, result, 'Token refreshed.');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  return success(res, 200, null, 'Password changed successfully.');
});

const me = asyncHandler(async (req, res) => {
  return success(res, 200, req.user.toJSON(), 'Current user.');
});

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refresh,
  changePassword,
  me,
};
