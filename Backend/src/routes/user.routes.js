const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const volunteerController = require('../controllers/volunteer.controller');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/me', userController.getCurrentUser);
router.put('/me', userController.updateCurrentUser);
router.get('/me/journey', userController.getUserJourney);

// User event lead invitations
router.get('/event-lead-invitations', userController.getUserInvitations);
router.post('/event-lead-invitations/:id/accept', userController.acceptInvitation);
router.post('/event-lead-invitations/:id/decline', userController.declineInvitation);

// User volunteering workflows
router.get('/volunteer/eligibility', volunteerController.getUserEligibility);
router.get('/volunteer/opportunities', volunteerController.getVolunteerOpportunities);
router.get('/volunteer/my-requests', volunteerController.getMyVolunteerRequests);
router.post('/volunteer/apply', volunteerController.applyVolunteer);
router.post('/volunteer/requests/:id/accept', volunteerController.userAcceptVolunteerRequest);
router.post('/volunteer/requests/:id/decline', volunteerController.userDeclineVolunteerRequest);

module.exports = router;