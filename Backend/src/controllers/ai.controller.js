/**
 * AI Controller for Express.
 * Proxies and orchestrates AI requests between React and Python FastAPI.
 */

const pythonAIService = require('../services/pythonAIService');

class AIController {
  /**
   * Health Check
   */
  async getHealth(req, res) {
    try {
      const health = await pythonAIService.checkHealth();
      return res.status(200).json(health);
    } catch (error) {
      return res.status(error.status || 503).json({
        status: 'error',
        message: error.message || 'AI service unavailable.',
      });
    }
  }

  /**
   * Conversational RAG Chat Query
   */
  async queryChat(req, res) {
    try {
      const { query, session_id } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ error: 'Query string is required.' });
      }

      const result = await pythonAIService.askRAG(query, session_id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to process AI chat query.',
      });
    }
  }

  /**
   * Get Chat Session History
   */
  async getChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const history = await pythonAIService.getChatHistory(sessionId);
      return res.status(200).json(history);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch chat history.',
      });
    }
  }

  /**
   * Clear Chat Session
   */
  async clearChatHistory(req, res) {
    try {
      const { sessionId } = req.params;
      const result = await pythonAIService.clearChatHistory(sessionId);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to clear chat history.',
      });
    }
  }

  /**
   * Personalized Recommendations
   */
  async getRecommendations(req, res) {
    try {
      const payload = req.body || {};
      const topN = parseInt(req.query.top_n || '5', 10);
      const recommendations = await pythonAIService.getRecommendations(payload, topN);
      return res.status(200).json(recommendations);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch activity recommendations.',
      });
    }
  }

  /**
   * User Engagement Analysis
   */
  async getUserEngagement(req, res) {
    try {
      const { userId } = req.params;
      const engagement = await pythonAIService.getUserEngagement(userId);
      return res.status(200).json(engagement);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch user engagement report.',
      });
    }
  }

  /**
   * Platform Aggregate Analytics
   */
  async getPlatformAnalytics(req, res) {
    try {
      const analytics = await pythonAIService.getPlatformAnalytics();
      return res.status(200).json(analytics);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch platform analytics.',
      });
    }
  }

  /**
   * Activities Catalog
   */
  async getActivities(req, res) {
    try {
      const activities = await pythonAIService.getActivities(req.query);
      return res.status(200).json(activities);
    } catch (error) {
      return res.status(error.status || 500).json({
        error: error.message || 'Failed to fetch activities catalog.',
      });
    }
  }
}

module.exports = new AIController();
