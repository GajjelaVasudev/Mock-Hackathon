/**
 * AI Routes for Express Backend.
 * Mounts endpoints proxying requests to Python FastAPI microservice.
 */
const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const aiController = require('../controllers/ai.controller');

// Health & Status
router.get('/health', asyncHandler((req, res) => aiController.getHealth(req, res)));

// Conversational RAG Assistant
router.post('/chat', asyncHandler((req, res) => aiController.queryChat(req, res)));
router.post('/chat/query', asyncHandler((req, res) => aiController.queryChat(req, res)));
router.get('/chat/:sessionId/history', asyncHandler((req, res) => aiController.getChatHistory(req, res)));
router.delete('/chat/:sessionId', asyncHandler((req, res) => aiController.clearChatHistory(req, res)));

// Personalized Recommendations
router.post('/recommend', asyncHandler((req, res) => aiController.getRecommendations(req, res)));

// Engagement Analysis (User & Platform)
router.get('/users/:userId/engagement', asyncHandler((req, res) => aiController.getUserEngagement(req, res)));
router.get('/analytics/engagement', asyncHandler((req, res) => aiController.getPlatformAnalytics(req, res)));

// Activities Catalog & Detail
router.get('/activities', asyncHandler((req, res) => aiController.getActivities(req, res)));
router.get('/activities/:id', asyncHandler((req, res) => aiController.getActivityById(req, res)));

// User Profile Operations
router.get('/users/:userId', asyncHandler((req, res) => aiController.getUser(req, res)));
router.post('/users', asyncHandler((req, res) => aiController.createUser(req, res)));
router.put('/users/:userId', asyncHandler((req, res) => aiController.updateUser(req, res)));

// Registrations
router.get('/users/:userId/registrations', asyncHandler((req, res) => aiController.getUserRegistrations(req, res)));
router.post('/registrations', asyncHandler((req, res) => aiController.createRegistration(req, res)));

// Participation
router.get('/users/:userId/participation', asyncHandler((req, res) => aiController.getUserParticipation(req, res)));
router.post('/users/:userId/participation', asyncHandler((req, res) => aiController.recordParticipation(req, res)));

module.exports = router;
