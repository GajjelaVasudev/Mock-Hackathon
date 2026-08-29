const asyncHandler = require('../utils/asyncHandler');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const volunteerController = require('../controllers/volunteer.controller');
const authenticate = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/me', asyncHandler(userController.getCurrentUser));
router.put('/me', asyncHandler(userController.updateCurrentUser));
router.get('/me/journey', asyncHandler(userController.getUserJourney));
router.post('/me/volunteer-request', asyncHandler(userController.requestVolunteer));

// User event lead invitations
router.get('/event-lead-invitations', asyncHandler(userController.getUserInvitations));
router.post('/event-lead-invitations/:id/accept', asyncHandler(userController.acceptInvitation));
router.post('/event-lead-invitations/:id/decline', asyncHandler(userController.declineInvitation));

// User volunteering workflows
router.get('/volunteer/eligibility', asyncHandler(volunteerController.getUserEligibility));
router.get('/volunteer/opportunities', asyncHandler(volunteerController.getVolunteerOpportunities));
router.get('/volunteer/my-requests', asyncHandler(volunteerController.getMyVolunteerRequests));
router.post('/volunteer/apply', asyncHandler(volunteerController.applyVolunteer));
router.post('/volunteer/requests/:id/accept', asyncHandler(volunteerController.userAcceptVolunteerRequest));
router.post('/volunteer/requests/:id/decline', asyncHandler(volunteerController.userDeclineVolunteerRequest));

module.exports = router;