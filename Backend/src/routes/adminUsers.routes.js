const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const adminUsersController = require('../controllers/adminUsers.controller');



router.use(authenticate, authorize('admin'));

router.get('/', adminUsersController.listUsers);
router.patch('/:id/role', adminUsersController.updateUserRole);
router.patch('/:id/status', adminUsersController.updateUserStatus);
router.get('/volunteers/requests', adminUsersController.listVolunteerRequests);
router.patch('/volunteers/requests/:id', adminUsersController.decideVolunteerRequest);

module.exports = router;