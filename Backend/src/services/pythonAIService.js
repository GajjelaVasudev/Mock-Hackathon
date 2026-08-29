/**
 * Python AI Service Client for Node.js / Express Backend.
 * Connects Express seamlessly to the Python FastAPI microservice on port 8000.
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PYTHON_API_URL = (process.env.PYTHON_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '60000', 10);

class PythonAIService {
  constructor() {
    this.baseUrl = PYTHON_API_URL;
  }

  /**
   * Universal HTTP request helper compatible with all Node versions.
   */
  request(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const fullUrl = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      const parsedUrl = url.parse(fullUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      const timeoutMs = options.timeout || DEFAULT_TIMEOUT_MS;

      const bodyData = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : null;

      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(bodyData ? { 'Content-Length': Buffer.byteLength(bodyData) } : {}),
          ...options.headers,
        },
        timeout: timeoutMs,
      };

      const req = client.request(reqOptions, (res) => {
        let rawData = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          rawData += chunk;
        });

        res.on('end', () => {
          let parsedData = null;
          try {
            parsedData = JSON.parse(rawData);
          } catch (e) {
            parsedData = { raw: rawData };
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            return resolve(parsedData);
          }

          let errorMsg = `Python AI service error (HTTP ${res.statusCode})`;
          if (parsedData && parsedData.detail) {
            errorMsg = typeof parsedData.detail === 'string' ? parsedData.detail : JSON.stringify(parsedData.detail);
          }
          const err = new Error(errorMsg);
          err.status = res.statusCode;
          return reject(err);
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const err = new Error('AI service request timed out. Please try again.');
        err.status = 504;
        return reject(err);
      });

      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED' || err.message?.includes('connect')) {
          const unavailableErr = new Error('Python AI services are temporarily unavailable on port 8000.');
          unavailableErr.status = 503;
          return reject(unavailableErr);
        }
        return reject(err);
      });

      if (bodyData) {
        req.write(bodyData);
      }
      req.end();
    });
  }

  /**
   * Health Check
   */
  async checkHealth() {
    return this.request('/api/v1/health');
  }

  /**
   * Conversational RAG Q&A Query
   */
  async askRAG(query, sessionId = null) {
    if (!query || !query.trim()) {
      throw new Error('Query string cannot be empty.');
    }
    return this.request('/api/v1/chat/query', {
      method: 'POST',
      body: {
        query: query.trim(),
        session_id: sessionId || undefined,
      },
    });
  }

  /**
   * Chat History Retrieval
   */
  async getChatHistory(sessionId) {
    return this.request(`/api/v1/chat/${encodeURIComponent(sessionId)}/history`);
  }

  /**
   * Clear Chat Session
   */
  async clearChatHistory(sessionId) {
    return this.request(`/api/v1/chat/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Personalized Activity Recommendations
   */
  async getRecommendations(payload = {}, topN = 5) {
    return this.request(`/api/v1/recommend?top_n=${topN}`, {
      method: 'POST',
      body: payload,
    });
  }

  /**
   * User Engagement Analysis (Phase 5 Analytics)
   */
  async getUserEngagement(userId) {
    return this.request(`/api/v1/users/${encodeURIComponent(userId)}/engagement`);
  }

  /**
   * Platform Aggregate Analytics
   */
  async getPlatformAnalytics() {
    return this.request('/api/v1/analytics/engagement');
  }

  /**
   * Activity Catalog with Filters
   */
  async getActivities(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.type) params.append('type', filters.type);

    const queryString = params.toString();
    const endpoint = `/api/v1/activities${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  /**
   * Activity Detail by ID
   */
  async getActivityById(activityId) {
    return this.request(`/api/v1/activities/${encodeURIComponent(activityId)}`);
  }

  /**
   * User Profile Operations
   */
  async getUser(userId) {
    return this.request(`/api/v1/users/${encodeURIComponent(userId)}`);
  }

  async createUser(userData) {
    return this.request('/api/v1/users', {
      method: 'POST',
      body: userData,
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/api/v1/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: userData,
    });
  }

  /**
   * Activity Registrations
   */
  async getUserRegistrations(userId) {
    return this.request(`/api/v1/users/${encodeURIComponent(userId)}/registrations`);
  }

  async createRegistration(registrationData) {
    return this.request('/api/v1/registrations', {
      method: 'POST',
      body: registrationData,
    });
  }

  /**
   * Participation History
   */
  async getUserParticipation(userId) {
    return this.request(`/api/v1/users/${encodeURIComponent(userId)}/participation`);
  }

  async recordParticipation(userId, participationData) {
    return this.request(`/api/v1/users/${encodeURIComponent(userId)}/participation`, {
      method: 'POST',
      body: participationData,
    });
  }
}

module.exports = new PythonAIService();
