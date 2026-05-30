'use strict';

const router = require('express').Router();
const categoryController = require('../controllers/categoryController');
const validators = require('../utils/validators');
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/rbacMiddleware');
const { auditAdminAction } = require('../middleware/auditLogger');

router.get('/', categoryController.list);

// Admin only
router.post('/', authenticate, requireAdmin, auditAdminAction, validators.createCategory, categoryController.create);
router.put('/:id', authenticate, requireAdmin, auditAdminAction, validators.updateCategory, categoryController.update);
router.delete('/:id', authenticate, requireAdmin, auditAdminAction, validators.idParamRule('id'), categoryController.deactivate);

module.exports = router;
