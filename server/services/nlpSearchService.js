'use strict';

const axios = require('axios');
const { Op, fn, col } = require('sequelize');
const { ClothingItem, ClothingImage, Category, User } = require('../models');
const logger = require('../utils/logger');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const TIMEOUT = 15000;

const includeOwnerAndImages = [
  { model: User, as: 'owner', attributes: ['id', 'name', 'profileImage'], where: { status: 'active' } },
  { model: Category, as: 'category' },
  { model: ClothingImage, as: 'images', separate: true, order: [['orderIndex', 'ASC']] },
];

// These come from ClothingItem schema ENUM definitions — not hardcoded knowledge
const GENDER_VALUES = ['male', 'female', 'unisex'];
const CONDITION_VALUES = ['new', 'like_new', 'good', 'fair'];

async function getDistinctColors() {
  const rows = await ClothingItem.findAll({
    attributes: [[fn('DISTINCT', col('color')), 'color']],
    where: { isAvailable: true, color: { [Op.ne]: null } },
    raw: true,
  });
  return rows.map((r) => r.color).filter(Boolean);
}

async function extractAttributes(query, categoryList, colorValues) {
  const payload = {
    query,
    threshold: 0.75,
    // Categories come from DB with admin-provided descriptions
    categories: categoryList,
    // Colors come from actual DB values
    colors: colorValues.map((c) => ({ name: c, description: c })),
    // Genders and conditions are schema ENUM values
    genders: GENDER_VALUES.map((g) => ({ name: g, description: g })),
    conditions: CONDITION_VALUES.map((c) => ({ name: c, description: c })),
  };

  const { data } = await axios.post(`${AI_URL}/api/query/attributes`, payload, { timeout: TIMEOUT });
  return data;
}

async function rankItems(queryEmbedding, items) {
  if (!items.length) return [];

  const payload = {
    query_embedding: queryEmbedding,
    items: items.map((item) => ({
      id: item.id,
      text: [item.title, item.description, item.brand, item.category?.name, item.color, item.gender]
        .filter(Boolean)
        .join('. '),
    })),
  };

  const { data } = await axios.post(`${AI_URL}/api/rank`, payload, { timeout: TIMEOUT });
  return data.rankings || [];
}

// Helper: Check if query explicitly contains a category name (word boundaries)
function findExplicitCategory(query, categories) {
  const queryLower = query.toLowerCase();
  for (const category of categories) {
    const catNameLower = category.name.toLowerCase();
    // Use word boundary regex to match exact category names only
    const regex = new RegExp(`\\b${catNameLower}\\b`, 'i');
    if (regex.test(queryLower)) {
      return category;
    }
  }
  return null;
}

async function nlpSearch(query, excludeUserId, limit = 20) {
  const [allCategories, colorValues] = await Promise.all([
    Category.findAll({ where: { isActive: true } }),
    getDistinctColors(),
  ]);

  logger.info(`[NLP] Query: "${query}" | DB categories: ${allCategories.map((c) => c.name).join(', ')}`);

  // Use DB name + description — admin must add descriptions for best results
  const categoryList = allCategories.map((c) => ({
    name: c.name,
    description: c.description || c.name,
  }));

  let attributes = {};
  let queryEmbedding = null;

  try {
    const [attrRes, embRes] = await Promise.all([
      extractAttributes(query, categoryList, colorValues),
      axios.post(`${AI_URL}/api/extract`, { text: query }, { timeout: TIMEOUT }),
    ]);
    attributes = attrRes;
    queryEmbedding = embRes.data?.embedding || null;
    logger.info(`[NLP] Attributes: ${JSON.stringify(attributes)}`);
  } catch (err) {
    logger.warn(`[NLP] Flask unavailable, falling back to keyword search: ${err.message}`);
    return null;
  }

  const where = { isAvailable: true };

  if (excludeUserId && !isNaN(Number(excludeUserId))) {
    where.userId = { [Op.ne]: Number(excludeUserId) };
  }

  // No category filter — fetch all items and let semantic ranking sort by relevance
  logger.info(`[NLP] No category filter - semantic ranking across all items`);

  // Only apply explicit attribute filters (color, gender, condition) if query mentions them
  const explicitCategory = findExplicitCategory(query, allCategories);
  if (explicitCategory) {
    where.categoryId = explicitCategory.id;
    logger.info(`[NLP] EXPLICIT CATEGORY DETECTED: "${explicitCategory.name}"`);
  }

  const topGender = (attributes.gender || []).find((g) => g.score >= 0.85);
  if (topGender) where.gender = { [Op.in]: [topGender.name, 'unisex'] };

  const topCondition = (attributes.condition || []).find((c) => c.score >= 0.85);
  if (topCondition) where.condition = topCondition.name;

  const topColor = (attributes.color || []).find((c) => c.score >= 0.84);
  if (topColor) where.color = { [Op.like]: `%${topColor.name}%` };

  logger.info(`[NLP] WHERE: ${JSON.stringify(where)}`);

  const dbItems = await ClothingItem.findAll({
    where,
    include: includeOwnerAndImages,
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  logger.info(`[NLP] DB items found: ${dbItems.length}`);
  if (!dbItems.length) return [];

  if (!queryEmbedding) return dbItems.slice(0, limit);

  try {
    const rankings = await rankItems(queryEmbedding, dbItems);
    const rankMap = new Map(rankings.map((r) => [r.id, r.score]));
    const scored = dbItems.map((item) => ({ ...item.toJSON(), matchScore: rankMap.get(item.id) ?? 0 }));

    const topScore = Math.max(...scored.map((i) => i.matchScore));
    // If query is specific (top score >= 0.80), use strict threshold 0.70
    // If query is vague (top score < 0.80), only show items within 0.05 of the top score
    const threshold = topScore >= 0.80 ? 0.70 : topScore - 0.05;
    logger.info(`[NLP] topScore: ${topScore.toFixed(3)}, threshold applied: ${threshold.toFixed(3)}`);

    return scored
      .filter((item) => item.matchScore >= threshold)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  } catch (err) {
    logger.warn(`[NLP] Ranking failed, using DB order: ${err.message}`);
    return dbItems.slice(0, limit).map((item) => ({ ...item.toJSON(), matchScore: 0 }));
  }
}

module.exports = { nlpSearch };
