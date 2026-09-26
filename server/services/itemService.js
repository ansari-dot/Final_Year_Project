'use strict';

const { Op } = require('sequelize');
const {
  ClothingItem,
  ClothingImage,
  ItemFeatures,
  Category,
  User,
  sequelize,
} = require('../models');
const ApiError = require('../utils/ApiError');
const cloudinaryService = require('./cloudinaryService');

const includeOwnerAndImages = [
  {
    model: User,
    as: 'owner',
    attributes: ['id', 'name', 'profileImage'],
  },
  { model: Category, as: 'category' },
  { model: ClothingImage, as: 'images', separate: true, order: [['orderIndex', 'ASC']] },
];

const createItem = async (userId, itemData, files = []) => {
  return sequelize.transaction(async (t) => {
    const item = await ClothingItem.create(
      {
        userId,
        categoryId: itemData.categoryId,
        title: itemData.title,
        description: itemData.description || null,
        brand: itemData.brand || null,
        size: itemData.size,
        gender: itemData.gender,
        condition: itemData.condition,
        color: itemData.color || null,
        location: itemData.location || 'Islamabad',
      },
      { transaction: t }
    );

    if (files && files.length > 0) {
      const uploaded = await cloudinaryService.uploadMultiple(files);
      const imageRecords = uploaded.map((u, idx) => ({
        itemId: item.id,
        url: u.url,
        publicId: u.publicId,
        isPrimary: idx === 0,
        orderIndex: idx,
      }));
      await ClothingImage.bulkCreate(imageRecords, { transaction: t });
    }

    await ItemFeatures.create({ itemId: item.id }, { transaction: t });
    return item;
  }).then((item) => getItemById(item.id));
};

const getItemById = async (itemId) => {
  const item = await ClothingItem.findByPk(itemId, { include: includeOwnerAndImages });
  if (!item) throw ApiError.notFound('Item not found.');
  return item;
};

const incrementView = async (itemId) => {
  await ClothingItem.increment('viewCount', { where: { id: itemId } });
};

const updateItem = async (itemId, userId, updates) => {
  const item = await ClothingItem.findByPk(itemId);
  if (!item) throw ApiError.notFound('Item not found.');
  if (item.userId !== userId) throw ApiError.forbidden('You do not own this item.');

  const allowed = [
    'title',
    'description',
    'categoryId',
    'size',
    'gender',
    'condition',
    'color',
    'brand',
    'location',
    'isAvailable',
  ];
  const data = {};
  allowed.forEach((k) => {
    if (updates[k] !== undefined) data[k] = updates[k];
  });
  await item.update(data);
  return getItemById(itemId);
};

const deleteItem = async (itemId, userId) => {
  const item = await ClothingItem.findByPk(itemId, {
    include: [{ model: ClothingImage, as: 'images' }],
  });
  if (!item) throw ApiError.notFound('Item not found.');
  if (item.userId !== userId) throw ApiError.forbidden('You do not own this item.');

  // Soft delete via flag - set unavailable; physical delete cascades images if forced
  await item.update({ isAvailable: false });

  // Optionally also delete cloudinary assets:
  if (item.images && item.images.length > 0) {
    await Promise.all(
      item.images.map((img) =>
        img.publicId ? cloudinaryService.deleteImage(img.publicId) : Promise.resolve()
      )
    );
  }
  return true;
};

const listItems = async (filters = {}, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const where = { isAvailable: true };

  if (filters.categoryId) {
    const catId = parseInt(filters.categoryId, 10);
    if (!isNaN(catId)) {
      const subcats = await Category.findAll({ where: { parentId: catId }, attributes: ['id'] });
      if (subcats.length > 0) {
        where.categoryId = { [Op.in]: [catId, ...subcats.map((s) => s.id)] };
      } else {
        where.categoryId = catId;
      }
    }
  }
  if (filters.gender) where.gender = filters.gender;
  if (filters.condition) where.condition = filters.condition;
  if (filters.size) where.size = filters.size;
  if (filters.color) where.color = { [Op.like]: `%${filters.color}%` };
  if (filters.brand) where.brand = { [Op.like]: `%${filters.brand}%` };
  if (filters.location) where.location = { [Op.like]: `%${filters.location}%` };
  if (filters.userId) where.userId = filters.userId;

  if (filters.q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${filters.q}%` } },
      { description: { [Op.like]: `%${filters.q}%` } },
      { brand: { [Op.like]: `%${filters.q}%` } },
      { location: { [Op.like]: `%${filters.q}%` } },
    ];
  }
  if (filters.excludeUserId) {
    where.userId = { [Op.ne]: filters.excludeUserId };
  }

  const { rows, count } = await ClothingItem.findAndCountAll({
    where,
    include: includeOwnerAndImages,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });
  return { items: rows, count };
};

const getUserItems = async (ownerId, page = 1, limit = 20) =>
  listItems({ userId: ownerId }, page, limit);

const addImages = async (itemId, userId, files) => {
  const item = await ClothingItem.findByPk(itemId, {
    include: [{ model: ClothingImage, as: 'images' }],
  });
  if (!item) throw ApiError.notFound('Item not found.');
  if (item.userId !== userId) throw ApiError.forbidden('You do not own this item.');

  if (!files || files.length === 0) {
    throw ApiError.badRequest('No files uploaded.');
  }
  const existingCount = item.images?.length || 0;
  const max = require('../config/env').upload.maxImagesPerItem;
  if (existingCount + files.length > max) {
    throw ApiError.badRequest(`Maximum ${max} images per item.`);
  }

  const uploaded = await cloudinaryService.uploadMultiple(files);
  const records = uploaded.map((u, idx) => ({
    itemId,
    url: u.url,
    publicId: u.publicId,
    isPrimary: existingCount === 0 && idx === 0,
    orderIndex: existingCount + idx,
  }));
  await ClothingImage.bulkCreate(records);
  return getItemById(itemId);
};

const deleteImage = async (itemId, imageId, userId) => {
  const image = await ClothingImage.findOne({
    where: { id: imageId, itemId },
    include: [{ model: ClothingItem, as: 'item' }],
  });
  if (!image) throw ApiError.notFound('Image not found.');
  if (image.item.userId !== userId) throw ApiError.forbidden('Not allowed.');

  if (image.publicId) {
    await cloudinaryService.deleteImage(image.publicId);
  }
  await image.destroy();

  // Promote a remaining image to primary if necessary
  if (image.isPrimary) {
    const next = await ClothingImage.findOne({
      where: { itemId },
      order: [['orderIndex', 'ASC']],
    });
    if (next) await next.update({ isPrimary: true });
  }
  return true;
};

const setPrimaryImage = async (itemId, imageId, userId) => {
  const item = await ClothingItem.findByPk(itemId);
  if (!item) throw ApiError.notFound('Item not found.');
  if (item.userId !== userId) throw ApiError.forbidden('Not allowed.');

  await ClothingImage.update({ isPrimary: false }, { where: { itemId } });
  const [count] = await ClothingImage.update(
    { isPrimary: true },
    { where: { id: imageId, itemId } }
  );
  if (!count) throw ApiError.notFound('Image not found.');
  return getItemById(itemId);
};

module.exports = {
  createItem,
  getItemById,
  incrementView,
  updateItem,
  deleteItem,
  listItems,
  getUserItems,
  addImages,
  deleteImage,
  setPrimaryImage,
};
