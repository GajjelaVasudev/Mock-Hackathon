const asyncHandler = require('../utils/asyncHandler');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');

router.get('/me', authenticate, asyncHandler(userController.getCurrentUser));
router.put('/me', authenticate, asyncHandler(userController.updateCurrentUser));
router.get('/me/journey', authenticate, asyncHandler(userController.getUserJourney));
router.post('/me/volunteer-request', authenticate, asyncHandler(userController.requestVolunteer));


module.exports = router;