const asyncHandler = require('../utils/asyncHandler');
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const badgeController = require('../controllers/badge.controller');

router.get('/', authenticate,  asyncHandler((req, res) => badgeController.getBadges(req, res)));
router.post('/',  authenticate , authorize('admin'),asyncHandler((req, res) => badgeController.createBadge(req, res)));
router.put('/:id', authenticate, authorize('admin'),asyncHandler((req, res) => badgeController.updateBadge(req, res)));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler((req, res) => badgeController.deleteBadge(req, res)));



module.exports = router;