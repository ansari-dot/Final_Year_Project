'use strict';

const { Category, ClothingItem, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');

const listCategories = async (activeOnly = true) => {
  const where = activeOnly ? { isActive: true } : {};
  return Category.findAll({
    where,
    order: [['name', 'ASC']],
    attributes: {
      include: [
        [
          sequelize.literal(
            '(SELECT COUNT(*) FROM clothing_items WHERE clothing_items.category_id = Category.id AND clothing_items.is_available = 1)'
          ),
          'itemCount',
        ],
      ],
    },
  });
};

const createCategory = async (data) => {
  const existing = await Category.findOne({ where: { name: data.name } });
  if (existing) throw ApiError.conflict('Category already exists.');
  return Category.create(data);
};

const updateCategory = async (id, data) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found.');
  await category.update(data);
  return category;
};

const deactivateCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found.');
  await category.update({ isActive: false });
  return category;
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
};
