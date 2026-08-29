/**
 * AI Routes for Express Backend.
 * Mounts endpoints proxying requests to Python FastAPI microservice.
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Health & Status
router.get('/health', (req, res) => aiController.getHealth(req, res));

// Conversational RAG Assistant
router.post('/chat', (req, res) => aiController.queryChat(req, res));
router.post('/chat/query', (req, res) => aiController.queryChat(req, res));
router.get('/chat/:sessionId/history', (req, res) => aiController.getChatHistory(req, res));
router.delete('/chat/:sessionId', (req, res) => aiController.clearChatHistory(req, res));

// Personalized Recommendations
router.post('/recommend', (req, res) => aiController.getRecommendations(req, res));

// Engagement Analysis (User & Platform)
router.get('/users/:userId/engagement', (req, res) => aiController.getUserEngagement(req, res));
router.get('/analytics/engagement', (req, res) => aiController.getPlatformAnalytics(req, res));

// Activities Catalog & Detail
router.get('/activities', (req, res) => aiController.getActivities(req, res));
router.get('/activities/:id', (req, res) => aiController.getActivityById(req, res));

// User Profile Operations
router.get('/users/:userId', (req, res) => aiController.getUser(req, res));
router.post('/users', (req, res) => aiController.createUser(req, res));
router.put('/users/:userId', (req, res) => aiController.updateUser(req, res));

// Registrations
router.get('/users/:userId/registrations', (req, res) => aiController.getUserRegistrations(req, res));
router.post('/registrations', (req, res) => aiController.createRegistration(req, res));

// Participation
router.get('/users/:userId/participation', (req, res) => aiController.getUserParticipation(req, res));
router.post('/users/:userId/participation', (req, res) => aiController.recordParticipation(req, res));

module.exports = router;
