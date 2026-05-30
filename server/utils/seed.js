'use strict';

require('dotenv').config();

const { sequelize, connectDB, syncDB } = require('../config/database');
const { User, Category, UserPreferences } = require('../models');
const logger = require('./logger');

const DEFAULT_CATEGORIES = [
  { name: 'T-Shirts', description: 'Casual t-shirts and tops' },
  { name: 'Shirts', description: 'Formal and casual shirts' },
  { name: 'Pants', description: 'Trousers, jeans, and chinos' },
  { name: 'Jeans', description: 'Denim jeans of all styles' },
  { name: 'Dresses', description: 'Casual and formal dresses' },
  { name: 'Skirts', description: 'Skirts of all lengths and styles' },
  { name: 'Jackets', description: 'Jackets, coats, and outerwear' },
  { name: 'Sweaters', description: 'Sweaters, hoodies, and knitwear' },
  { name: 'Activewear', description: 'Sportswear and athletic clothing' },
  { name: 'Shoes', description: 'Sneakers, boots, formal shoes' },
  { name: 'Accessories', description: 'Bags, belts, hats, scarves' },
  { name: 'Traditional', description: 'Cultural and traditional wear' },
  { name: 'Kids', description: 'Children\'s clothing' },
  { name: 'Other', description: 'Other clothing items' },
];

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@rewearx.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

const run = async () => {
  try {
    await connectDB();
    await syncDB({ alter: true });

    let createdCats = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      const [, created] = await Category.findOrCreate({
        where: { name: cat.name },
        defaults: cat,
      });
      if (created) createdCats += 1;
    }
    logger.info(`Seeded ${createdCats} new categories (${DEFAULT_CATEGORIES.length} total).`);

    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: ADMIN_EMAIL },
      defaults: {
        name: 'ReWearX Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        gender: 'other',
        role: 'admin',
        status: 'active',
        isVerified: true,
      },
    });

    if (adminCreated) {
      await UserPreferences.findOrCreate({
        where: { userId: admin.id },
        defaults: { userId: admin.id },
      });
      logger.info(`Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
      logger.warn('IMPORTANT: Change the admin password in production!');
    } else {
      logger.info(`Admin user already exists: ${ADMIN_EMAIL}`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  }
};

run();
