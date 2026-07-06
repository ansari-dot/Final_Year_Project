'use strict';

const { Category, ClothingItem, sequelize } = require('../models');
const { uploadImage, deleteImage } = require('./cloudinaryService');
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

const createCategory = async (file, data) => {
  const existing = await Category.findOne({ where: { name: data.name } });
  if (existing) throw ApiError.conflict('Category already exists.');

  let iconUrl = null;
  let cloudinaryPublicId = null;

  if (file) {
    const uploaded = await uploadImage(file, 'categories');
    iconUrl = uploaded.url;
    cloudinaryPublicId = uploaded.publicId;
  }

  return Category.create({
    name: data.name,
    description: data.description || null,
    iconUrl,
    cloudinaryPublicId,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });
};

const updateCategory = async (id, file, data) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found.');

  if (file) {
    // Delete old image if exists
    if (category.cloudinaryPublicId) {
      await deleteImage(category.cloudinaryPublicId);
    }

    // Upload new image
    const uploaded = await uploadImage(file, 'categories');
    category.iconUrl = uploaded.url;
    category.cloudinaryPublicId = uploaded.publicId;
  }

  if (data.name !== undefined) category.name = data.name;
  if (data.description !== undefined) category.description = data.description;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  await category.save();
  return category;
};

const deactivateCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found.');
  await category.update({ isActive: false });
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);
  if (!category) throw ApiError.notFound('Category not found.');
  
  // Check if category has items
  const itemCount = await sequelize.query(
    'SELECT COUNT(*) as count FROM clothing_items WHERE category_id = ? AND is_available = 1',
    {
      replacements: [id],
      type: sequelize.QueryTypes.SELECT,
    }
  );
  
  if (itemCount[0].count > 0) {
    throw ApiError.badRequest(`Cannot delete category with ${itemCount[0].count} active items. Deactivate it instead or remove items first.`);
  }

  // Delete image from Cloudinary
  if (category.cloudinaryPublicId) {
    await deleteImage(category.cloudinaryPublicId);
  }
  
  await category.destroy();
  return category;
};

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
  deleteCategory,
};
