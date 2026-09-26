'use strict';

const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  port: env.db.port,
  dialect: env.db.dialect,
  logging: env.isDevelopment ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 15,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  dialectOptions: {
    charset: 'utf8mb4',
    dateStrings: true,
    typeCast: true,
  },
  timezone: '+00:00',
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection established successfully.');

    // Auto-migrate preferred_styles column if missing
    try {
      await sequelize.query(
        `ALTER TABLE \`user_preferences\` ADD COLUMN \`preferred_styles\` TEXT NULL AFTER \`preferred_colors\`;`
      );
      logger.info('Database column preferred_styles created.');
    } catch (_) {
      // Column already exists, safe to ignore
    }

    // Auto-migrate location column in clothing_items if missing
    try {
      await sequelize.query(
        `ALTER TABLE \`clothing_items\` ADD COLUMN \`location\` VARCHAR(150) NULL DEFAULT 'Islamabad' AFTER \`color\`;`
      );
      logger.info('Database column location created in clothing_items.');
    } catch (_) {
      // Column already exists, safe to ignore
    }

    // Auto-migrate location and address columns in users if missing
    try {
      await sequelize.query(
        `ALTER TABLE \`users\` ADD COLUMN \`location\` VARCHAR(150) NULL DEFAULT 'Islamabad' AFTER \`gender\`;`
      );
      logger.info('Database column location created in users.');
    } catch (_) {
      // Column already exists, safe to ignore
    }

    try {
      await sequelize.query(
        `ALTER TABLE \`users\` ADD COLUMN \`address\` TEXT NULL AFTER \`location\`;`
      );
      logger.info('Database column address created in users.');
    } catch (_) {
      // Column already exists, safe to ignore
    }

    try {
      await sequelize.query(
        `ALTER TABLE \`swap_requests\` ADD COLUMN \`accepted_at\` DATETIME NULL AFTER \`status\`;`
      );
      logger.info('Database column accepted_at created in swap_requests.');
    } catch (_) {
      // Column already exists, safe to ignore
    }

    try {
      await sequelize.query(
        `ALTER TABLE \`categories\` ADD COLUMN \`parent_id\` INT NULL DEFAULT NULL AFTER \`id\`;`
      );
      logger.info('Database column parent_id created in categories.');
    } catch (_) {
      // Column already exists, safe to ignore
    }

    try {
      const [indexes] = await sequelize.query(`SHOW INDEX FROM \`categories\` WHERE Key_name != 'PRIMARY';`);
      for (const idx of indexes) {
        if (idx.Column_name === 'name' || idx.Key_name.includes('name')) {
          try {
            await sequelize.query(`ALTER TABLE \`categories\` DROP INDEX \`${idx.Key_name}\`;`);
            logger.info(`Dropped index ${idx.Key_name} on categories.`);
          } catch (_) {}
        }
      }
    } catch (_) {
      // Safe to ignore
    }

    // Auto-create disputes table if missing
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`disputes\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`swap_request_id\` INT NOT NULL,
          \`initiator_id\` INT NOT NULL,
          \`respondent_id\` INT NOT NULL,
          \`reason\` ENUM('item_not_as_described','damaged_item','fake_brand','missing_item','never_shipped','other') NOT NULL,
          \`description\` TEXT NOT NULL,
          \`status\` ENUM('opened','under_review','resolved_cancel_swap','resolved_dismissed','resolved_warning_issued','resolved_block_user') DEFAULT 'opened',
          \`resolution_notes\` TEXT NULL,
          \`resolved_by_id\` INT NULL,
          \`resolved_at\` DATETIME NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      logger.info('Database table disputes verified/created.');
    } catch (_) {
      // Safe to ignore
    }

    // Auto-migrate status ENUM column in disputes table
    try {
      await sequelize.query(`
        ALTER TABLE \`disputes\` MODIFY COLUMN \`status\` ENUM('opened','under_review','resolved_cancel_swap','resolved_dismissed','resolved_warning_issued','resolved_block_user') DEFAULT 'opened';
      `);
      logger.info('Database column status in disputes updated.');
    } catch (_) {
      // Safe to ignore
    }

    // Auto-create dispute_evidences table if missing
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`dispute_evidences\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`dispute_id\` INT NOT NULL,
          \`uploader_id\` INT NOT NULL,
          \`url\` VARCHAR(500) NOT NULL,
          \`public_id\` VARCHAR(255) NULL,
          \`caption\` VARCHAR(255) NULL,
          \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      logger.info('Database table dispute_evidences verified/created.');
    } catch (_) {
      // Safe to ignore
    }

    return sequelize;
  } catch (error) {
    logger.error('Unable to connect to MySQL:', error.message);
    throw error;
  }
};

const syncDB = async (options = {}) => {
  try {
    await sequelize.sync(options);
    logger.info(`Database synced (alter=${!!options.alter}, force=${!!options.force}).`);
  } catch (error) {
    logger.error('DB sync failed:', error.message);
    throw error;
  }
};

module.exports = { sequelize, connectDB, syncDB, Sequelize };
