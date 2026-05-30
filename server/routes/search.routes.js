'use strict';

const router = require('express').Router();
const itemController = require('../controllers/itemController');
const validators = require('../utils/validators');
const { optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, validators.itemSearch, itemController.search);

module.exports = router;
