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
      text: [
        item.title,
        item.category?.name,
        item.category?.description,
        item.description,
        item.brand,
        item.color,
        item.gender,
      ]
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

  logger.info(`[NLP] Query: "${query}" | DB categories count: ${allCategories.length}`);

  // Include DB category descriptions for richer semantic understanding
  const categoryList = allCategories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || `${c.name} clothing and fashion apparel`,
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

  // 1. Explicit Category Match (e.g. "jacket", "shirt")
  const explicitCategory = findExplicitCategory(query, allCategories);
  if (explicitCategory) {
    where.categoryId = explicitCategory.id;
    logger.info(`[NLP] EXPLICIT CATEGORY MATCH: "${explicitCategory.name}" (ID: ${explicitCategory.id})`);
  } else {
    // 2. Dynamic Semantic Category Match (e.g. "warm clothes" matching Jackets/Hoodies via AI score >= 0.78)
    const topMatchedCategory = (attributes.category || []).find((c) => c.score >= 0.78);
    if (topMatchedCategory) {
      const catObj = allCategories.find((c) => c.name.toLowerCase() === topMatchedCategory.name.toLowerCase());
      if (catObj) {
        // Match this category or its subcategories dynamically
        const subCatIds = allCategories.filter((c) => c.parentId === catObj.id).map((c) => c.id);
        where.categoryId = { [Op.in]: [catObj.id, ...subCatIds] };
        logger.info(`[NLP] DYNAMIC SEMANTIC CATEGORY MATCH: "${catObj.name}" with subcategories: [${subCatIds.join(', ')}]`);
      }
    }
  }

  // Apply high-confidence gender/condition/color attribute filters dynamically
  const topGender = (attributes.gender || []).find((g) => g.score >= 0.85);
  if (topGender) where.gender = { [Op.in]: [topGender.name, 'unisex'] };

  const topCondition = (attributes.condition || []).find((c) => c.score >= 0.85);
  if (topCondition) where.condition = topCondition.name;

  const topColor = (attributes.color || []).find((c) => c.score >= 0.84);
  if (topColor) where.color = { [Op.like]: `%${topColor.name}%` };

  logger.info(`[NLP] WHERE Clause: ${JSON.stringify(where)}`);

  const dbItems = await ClothingItem.findAll({
    where,
    include: includeOwnerAndImages,
    order: [['createdAt', 'DESC']],
    limit: 100,
  });

  logger.info(`[NLP] DB candidates found: ${dbItems.length}`);
  if (!dbItems.length) return [];

  if (!queryEmbedding) return dbItems.slice(0, limit);

  try {
    const rankings = await rankItems(queryEmbedding, dbItems);
    const rankMap = new Map(rankings.map((r) => [r.id, r.score]));
    const scored = dbItems.map((item) => ({ ...item.toJSON(), matchScore: rankMap.get(item.id) ?? 0 }));

    const topScore = Math.max(...scored.map((i) => i.matchScore));
    // Dynamic relative threshold: Keep items scoring at least 70% of top match or minimum 0.50
    const minThreshold = 0.50;
    const dynamicThreshold = Math.max(minThreshold, topScore * 0.70);

    logger.info(`[NLP] topScore: ${topScore.toFixed(3)}, threshold applied: ${dynamicThreshold.toFixed(3)}`);

    return scored
      .filter((item) => item.matchScore >= dynamicThreshold)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  } catch (err) {
    logger.warn(`[NLP] Semantic ranking failed, returning DB candidates: ${err.message}`);
    return dbItems.slice(0, limit).map((item) => ({ ...item.toJSON(), matchScore: 0 }));
  }
}

module.exports = { nlpSearch };
