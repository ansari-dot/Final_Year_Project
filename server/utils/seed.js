'use strict';

require('dotenv').config();

const { sequelize, connectDB } = require('../config/database');
const { User, Category, UserPreferences } = require('../models');
const logger = require('./logger');

const CATEGORIES_DATA = [
  {
    name: 'Men',
    description: "Men's fashion and apparel",
    iconUrl: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=600&q=80',
    subcategories: [
      { name: 'T-Shirts', iconUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80' },
      { name: 'Shirts', iconUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hoodies', iconUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sweaters', iconUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jackets', iconUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jeans', iconUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80' },
      { name: 'Trousers', iconUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80' },
      { name: 'Shalwar Kameez', iconUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    name: 'Women',
    description: "Women's fashion and apparel",
    iconUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    subcategories: [
      { name: 'T-Shirts', iconUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80' },
      { name: 'Shirts', iconUrl: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hoodies', iconUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sweaters', iconUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jackets', iconUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jeans', iconUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=80' },
      { name: 'Trousers', iconUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80' },
      { name: 'Dresses', iconUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80' },
      { name: 'Kurtis', iconUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80' },
      { name: 'Shalwar Kameez', iconUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80' },
      { name: 'Lehengas', iconUrl: 'https://images.unsplash.com/photo-1583391733975-d227b7c53d10?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    name: 'Unisex',
    description: 'Unisex clothing and apparel for everyone',
    iconUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
    subcategories: [
      { name: 'T-Shirts', iconUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80' },
      { name: 'Hoodies', iconUrl: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sweaters', iconUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80' },
      { name: 'Jackets', iconUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=600&q=80' },
    ],
  },
];

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@rewearx.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

const run = async () => {
  try {
    await connectDB();

    // 1. Clear all existing categories safely
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.query('DELETE FROM user_interests;');
    await sequelize.query('DELETE FROM categories;');
    await sequelize.query('ALTER TABLE categories AUTO_INCREMENT = 1;');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    logger.info('Wiped all existing categories.');

    // 2. Seed main categories and subcategories with images
    let mainCount = 0;
    let subCount = 0;

    for (const group of CATEGORIES_DATA) {
      const mainCat = await Category.create({
        name: group.name,
        description: group.description,
        iconUrl: group.iconUrl,
        parentId: null,
        isActive: true,
      });
      mainCount += 1;

      for (const sub of group.subcategories) {
        await Category.create({
          name: sub.name,
          description: `${sub.name} under ${group.name}`,
          iconUrl: sub.iconUrl,
          parentId: mainCat.id,
          isActive: true,
        });
        subCount += 1;
      }
    }

    logger.info(`Successfully seeded ${mainCount} Main Categories and ${subCount} Subcategories with high quality images!`);

    // Reassign existing clothing items to first subcategory if any
    const firstSub = await Category.findOne({ where: { parentId: { [sequelize.Sequelize.Op.ne]: null } } });
    if (firstSub) {
      await sequelize.query('UPDATE clothing_items SET category_id = ?;', {
        replacements: [firstSub.id],
      });
      logger.info(`Reassigned existing items to category "${firstSub.name}" (ID: ${firstSub.id}).`);
    }

    // 3. Ensure Admin user exists
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
    } else {
      logger.info(`Admin user ready: ${ADMIN_EMAIL}`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error('Seed failed:', err);
    process.exit(1);
  }
};

run();
