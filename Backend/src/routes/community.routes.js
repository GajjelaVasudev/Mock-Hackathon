const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const authenticate = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

// All community routes require authentication
router.use(authenticate);

// 1. Feed & Experiences
router.get('/feed', communityController.getFeed);
router.get('/attended-activities', communityController.getAttendedActivities);
router.post('/experiences', upload.array('images', 5), communityController.createExperiencePost);
router.get('/experiences/:id', communityController.getExperiencePostById);
router.post('/experiences/:id/comments', communityController.addComment);
router.post('/experiences/:id/reactions', communityController.toggleReaction);
router.post('/experiences/:id/save', communityController.toggleSavePost);
router.delete('/experiences/:id', communityController.deleteExperiencePost);
router.get('/my-experiences', communityController.getMyExperiences);

// 2. Activity Group Chat & My Discussions
router.get('/my-conversations', communityController.getMyConversations);
router.get('/activity/:activityId', communityController.getActivityChatInfo);
router.get('/activity/:activityId/messages', communityController.getActivityMessages);
router.post('/activity/:activityId/messages', upload.array('images', 3), communityController.sendActivityMessage);
router.post('/activity/:activityId/read', communityController.markConversationRead);

// 3. Image Upload Direct Helper
router.post('/upload-images', upload.array('images', 5), communityController.uploadImages);

// 4. Reporting & Moderation
router.post('/reports', communityController.createReport);
router.get('/admin/reports', communityController.getAdminReports);
router.post('/admin/reports/:id/resolve', communityController.resolveReport);

module.exports = router;
