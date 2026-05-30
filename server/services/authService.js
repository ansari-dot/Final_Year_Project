'use strict';

const { Op } = require('sequelize');
const { User, UserPreferences } = require('../models');
const ApiError = require('../utils/ApiError');
const {
  signAccessToken,
  signRefreshToken,
  randomToken,
  hashToken,
  verifyRefreshToken,
} = require('../utils/tokens');
const env = require('../config/env');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const buildAuthResponse = (user) => {
  const payload = { id: user.id, role: user.role, email: user.email };
  return {
    user: user.toJSON(),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ id: user.id }),
    expiresIn: env.jwt.expiresIn,
  };
};

const register = async ({ email, password, name, gender, phone, dateOfBirth }) => {
  const existing = await User.scope('withPassword').findOne({ where: { email } });
  if (existing) throw ApiError.conflict('Email already registered.');

  const verificationToken = randomToken(32);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    name,
    email,
    password,
    gender,
    phone: phone || null,
    dateOfBirth: dateOfBirth || null,
    verificationToken: hashToken(verificationToken),
    verificationExpires,
  });

  await UserPreferences.create({ userId: user.id });

  const verifyUrl = `${env.clientUrl}/verify-email/${verificationToken}`;
  await emailService.sendVerificationEmail(email, name, verifyUrl).catch((err) => {
    logger.error(`Verification email failed for ${email}: ${err.message}`);
  });

  return buildAuthResponse(user);
};

const login = async (email, password) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) throw ApiError.unauthorized('Invalid email or password.');
  if (user.status === 'blocked') {
    throw ApiError.forbidden('Account blocked. Contact support.');
  }
  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid email or password.');

  user.lastLoginAt = new Date();
  await user.save();

  return buildAuthResponse(user);
};

const verifyEmail = async (rawToken) => {
  const tokenHash = hashToken(rawToken);
  const user = await User.scope('withPassword').findOne({
    where: {
      verificationToken: tokenHash,
      verificationExpires: { [Op.gt]: new Date() },
    },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired verification token.');

  user.isVerified = true;
  user.verificationToken = null;
  user.verificationExpires = null;
  await user.save();
  return user.toJSON();
};

const resendVerification = async (userId) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.isVerified) throw ApiError.badRequest('Email already verified.');

  const verificationToken = randomToken(32);
  user.verificationToken = hashToken(verificationToken);
  user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const verifyUrl = `${env.clientUrl}/verify-email/${verificationToken}`;
  await emailService.sendVerificationEmail(user.email, user.name, verifyUrl);
  return true;
};

const forgotPassword = async (email) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    // Avoid user-enumeration
    return { sent: false };
  }

  const resetToken = randomToken(32);
  user.resetToken = hashToken(resetToken);
  user.resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${env.clientUrl}/reset-password/${resetToken}`;
  await emailService.sendPasswordResetEmail(email, user.name, resetUrl).catch((err) => {
    logger.error(`Password reset email failed for ${email}: ${err.message}`);
  });

  return { sent: true };
};

const resetPassword = async (rawToken, newPassword) => {
  const tokenHash = hashToken(rawToken);
  const user = await User.scope('withPassword').findOne({
    where: {
      resetToken: tokenHash,
      resetExpires: { [Op.gt]: new Date() },
    },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired reset token.');

  user.password = newPassword;
  user.resetToken = null;
  user.resetExpires = null;
  await user.save();
  return true;
};

const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_) {
    throw ApiError.unauthorized('Invalid refresh token.');
  }
  const user = await User.findByPk(decoded.id);
  if (!user) throw ApiError.unauthorized('User not found.');
  if (user.status === 'blocked') throw ApiError.forbidden('Account blocked.');
  return buildAuthResponse(user);
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw ApiError.notFound('User not found.');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect.');
  user.password = newPassword;
  await user.save();
  return true;
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  changePassword,
};
