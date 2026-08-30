const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const volunteerController = require('../controllers/volunteer.controller');
const achievementController = require('../controllers/achievement.controller');

// Protect all admin routes for staff and admin roles
router.use(authenticate, authorize('admin', 'staff'));

// Platform Overview
router.get('/overview', adminController.getOverview);

// Achievements & Recognition Management (Staff / Admin)
router.get('/achievements', achievementController.getAdminAchievements);
router.patch('/achievements/:id/fulfillment', achievementController.updateFulfillment);

// Eligible Event Leaders (>5 attended events)
router.get('/eligible-leaders', adminController.getEligibleLeaders);
router.post('/event-lead-invitations', adminController.sendEventLeadInvitation);
router.get('/event-lead-invitations', adminController.getAllInvitations);

// Volunteer Management (Admin / Staff)
router.get('/volunteer/eligible-users', volunteerController.getAdminEligibleUsers);
router.get('/volunteer/requests', volunteerController.getAdminVolunteerRequests);
router.post('/volunteer/requests', volunteerController.adminSendVolunteerRequest);
router.post('/volunteer/requests/:id/accept', volunteerController.adminAcceptVolunteerRequest);
router.post('/volunteer/requests/:id/decline', volunteerController.adminDeclineVolunteerRequest);

// Users and Staff Management
router.get('/users', adminController.getUsersList);
router.get('/staff', adminController.getStaffList);

// Event Management CRUD & Image Search
router.post('/events/search-image', adminController.searchEventImage);
router.post('/activities/search-image', adminController.searchEventImage);
router.post('/events/backfill-images', adminController.backfillEventImages);
router.post('/activities/backfill-images', adminController.backfillEventImages);
router.get('/events', adminController.getEventsList);
router.post('/events', adminController.createEvent);
router.put('/events/:id', adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);
router.get('/events/:id/participants', adminController.getEventParticipants);

module.exports = router;
