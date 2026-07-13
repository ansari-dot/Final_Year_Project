'use strict';

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');
const templates = require('../utils/emailTemplates');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!env.email.host || !env.email.user) {
    logger.warn('Email transporter not configured – emails will be logged to console only.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
    auth: { user: env.email.user, pass: env.email.password },
  });

  transporter.verify().then(
    () => logger.info('Email transporter ready.'),
    (err) => logger.error('Email transporter verification failed:', err.message)
  );

  return transporter;
};

const sendEmail = async (to, subject, html, text = null) => {
  try {
    const t = getTransporter();
    if (!t) {
      logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      logger.debug(`[DEV EMAIL HTML] ${html}`);
      return { dev: true };
    }
    const info = await t.sendMail({
      from: env.email.from,
      to,
      subject,
      html,
      text: text || subject,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
    return null;
  }
};

const sendVerificationEmail = (to, name, verifyUrl) =>
  sendEmail(to, 'Verify your ReWearX account', templates.verifyEmail(name, verifyUrl));

const sendOtpEmail = (to, name, otp) =>
  sendEmail(to, 'Your ReWearX verification code', templates.otpVerification(name, otp));

const sendPasswordResetEmail = (to, name, resetUrl) =>
  sendEmail(to, 'Reset your ReWearX password', templates.passwordReset(name, resetUrl));

const sendSwapNotification = (to, name, type, details) => {
  const subjects = {
    swap_request: 'New Swap Request on ReWearX',
    swap_accepted: 'Your swap was accepted!',
    swap_rejected: 'Swap request update',
    swap_completed: 'Swap completed',
  };
  return sendEmail(to, subjects[type] || 'ReWearX update', templates.swapNotification(name, type, details));
};

const sendGenericEmail = (to, name, title, body) =>
  sendEmail(to, title, templates.genericNotification(name, title, body));

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendSwapNotification,
  sendGenericEmail,
};
