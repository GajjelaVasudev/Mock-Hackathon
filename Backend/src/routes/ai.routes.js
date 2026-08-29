/**
 * AI Routes for Express Backend.
 * Mounts endpoints proxying requests to Python FastAPI microservice.
 */
const asyncHandler = require('../utils/asyncHandler');
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Health & Status
router.get('/health', asyncHandler((req, res) => aiController.getHealth(req, res)));

// Conversational RAG Assistant
router.post('/chat/query', asyncHandler((req, res) => aiController.queryChat(req, res)));
router.get('/chat/:sessionId/history', asyncHandler((req, res) => aiController.getChatHistory(req, res)));
router.delete('/chat/:sessionId', asyncHandler((req, res) => aiController.clearChatHistory(req, res)));

// Personalized Recommendations
router.post('/recommend', asyncHandler((req, res) => aiController.getRecommendations(req, res)));

// Engagement Analysis (User & Platform)
router.get('/users/:userId/engagement', asyncHandler((req, res) => aiController.getUserEngagement(req, res)));
router.get('/analytics/engagement', asyncHandler((req, res) => aiController.getPlatformAnalytics(req, res)));

// Activities Catalog
router.get('/activities', asyncHandler((req, res) => aiController.getActivities(req, res)));

module.exports = router;
