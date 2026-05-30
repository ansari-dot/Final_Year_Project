'use strict';

require('dotenv').config();

const required = (key, fallback = undefined) => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    return undefined;
  }
  return value;
};

const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: parseInt(required('PORT', '5000'), 10),
  apiVersion: required('API_VERSION', 'v1'),

  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  adminUrl: required('ADMIN_URL', 'http://localhost:5174'),
  corsOrigins: (required('CORS_ORIGINS', 'http://localhost:5173') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  db: (() => {
    const rawDialect = (required('DB_DIALECT', 'mysql') || 'mysql').toLowerCase();
    // Sequelize accepts "mysql" (works with MySQL 5.7 and 8.x), not "mysql80".
    const dialect = rawDialect === 'mysql80' || rawDialect === 'mariadb' ? 'mysql' : rawDialect;
    return {
      host: required('DB_HOST', 'localhost'),
      port: parseInt(required('DB_PORT', '3306'), 10),
      name: required('DB_NAME', 'rewearx'),
      user: required('DB_USER', 'root'),
      password: required('DB_PASSWORD', ''),
      dialect,
    };
  })(),

  jwt: {
    secret: required('JWT_SECRET', 'change_me_in_production'),
    expiresIn: required('JWT_EXPIRES_IN', '24h'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'change_me_in_production_refresh'),
    refreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  bcrypt: {
    saltRounds: parseInt(required('BCRYPT_SALT_ROUNDS', '12'), 10),
  },

  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: required('CLOUDINARY_API_KEY', ''),
    apiSecret: required('CLOUDINARY_API_SECRET', ''),
    folder: required('CLOUDINARY_FOLDER', 'rewearx'),
  },

  email: {
    host: required('EMAIL_HOST', 'smtp.sendgrid.net'),
    port: parseInt(required('EMAIL_PORT', '587'), 10),
    secure: required('EMAIL_SECURE', 'false') === 'true',
    user: required('EMAIL_USER', ''),
    password: required('EMAIL_PASSWORD', ''),
    from: required('EMAIL_FROM', 'ReWearX <no-reply@rewearx.com>'),
  },

  rateLimit: {
    windowMs: parseInt(required('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(required('RATE_LIMIT_MAX', '100'), 10),
    authMax: parseInt(required('AUTH_RATE_LIMIT_MAX', '10'), 10),
  },

  upload: {
    maxFileSizeMb: parseInt(required('MAX_FILE_SIZE_MB', '5'), 10),
    maxImagesPerItem: parseInt(required('MAX_IMAGES_PER_ITEM', '5'), 10),
  },

  fastapi: {
    url: required('FASTAPI_URL', 'http://localhost:8000'),
    timeoutMs: parseInt(required('FASTAPI_TIMEOUT_MS', '10000'), 10),
  },
};

env.isProduction = env.nodeEnv === 'production';
env.isDevelopment = env.nodeEnv === 'development';
env.isTest = env.nodeEnv === 'test';

module.exports = env;
