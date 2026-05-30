'use strict';

const categoryService = require('../services/categoryService');
const { success, asyncHandler } = require('../utils/response');

const list = asyncHandler(async (req, res) => {
  const all = req.query.all === 'true';
  const cats = await categoryService.listCategories(!all);
  return success(res, 200, cats, 'Categories fetched.');
});

const create = asyncHandler(async (req, res) => {
  const c = await categoryService.createCategory(req.body);
  return success(res, 201, c, 'Category created.');
});

const update = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const c = await categoryService.updateCategory(id, req.body);
  return success(res, 200, c, 'Category updated.');
});

const deactivate = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const c = await categoryService.deactivateCategory(id);
  return success(res, 200, c, 'Category deactivated.');
});

module.exports = { list, create, update, deactivate };
