const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/auth.middleware');

router.get('/me', authenticate, userController.getCurrentUser);
router.put('/me', authenticate, userController.updateCurrentUser);
router.get('/me/joruney', userController.getUserJourney);
router.post('/me/volunteer-request', authenticate, userController.requestVolunteer);


module.exports = router;