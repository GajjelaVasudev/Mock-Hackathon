const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateCurrentUser);
router.get('/me/joruney', userController.getUserJourney);


module.exports = router;