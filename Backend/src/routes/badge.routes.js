const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const badgeController = require('../controllers/badge.controller');


router.get('/', authenticate, badgeController.getBadges);
router.post('/', authenticate, authorize('admin'), badgeController.createBadge);
router.put('/:id', authenticate, authorize('admin'), badgeController.updateBadge);
router.delete('/:id', authenticate, authorize('admin'), badgeController.deleteBadge);



module.exports = router;