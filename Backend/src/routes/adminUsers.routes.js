const asyncHandler = require('../utils/asyncHandler');
const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const adminUsersController = require('../controllers/adminUsers.controller');




router.use(authenticate, authorize('admin'));

router.get('/', asyncHandler(adminUsersController.listUsers));
router.patch('/:id/role', asyncHandler(adminUsersController.updateUserRole));
router.patch('/:id/status', asyncHandler(adminUsersController.updateUserStatus));
router.get('/volunteers/requests', asyncHandler(adminUsersController.listVolunteerRequests));
router.patch('/volunteers/requests/:id', asyncHandler(adminUsersController.decideVolunteerRequest));

module.exports = router;