/**
 * BNHS Nature-Engagement Platform — Centralized API Service
 * Connects directly to the FastAPI Backend (/api/v1).
 */

import {
  ActivitiesResponse,
  Activity,
  ActivityFilters,
  ChatMessage,
  HealthStatus,
  ParticipationItem,
  PlatformEngagementResponse,
  Recommendation,
  RecommendationResponse,
  RegistrationItem,
  UserEngagementResponse,
  UserProfile,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL.replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          }
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      return await response.json() as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        throw new Error('Unable to connect to BNHS backend API server. Please ensure FastAPI is running on port 8000.');
      }
      throw err;
    }
  }

  /**
   * Health Check
   */
  async checkHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/v1/health');
  }

  /**
   * Activities Catalog & Filtering
   */
  async getActivities(filters: ActivityFilters = {}): Promise<ActivitiesResponse> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.type) params.append('type', filters.type);

    const queryString = params.toString();
    const endpoint = `/api/v1/activities${queryString ? `?${queryString}` : ''}`;
    return this.request<ActivitiesResponse>(endpoint);
  }

  async getActivityById(id: string): Promise<Activity | null> {
    const catalog = await this.getActivities();
    const found = catalog.activities.find((a) => a.id === id);
    return found || null;
  }

  /**
   * Conversational RAG Knowledge Base Assistant Query
   */
  async askAssistant(
    query: string,
    sessionId?: string
  ): Promise<{ session_id?: string; query?: string; rewritten_query?: string; answer: string; sources: any[] }> {
    return this.request<{ session_id?: string; query?: string; rewritten_query?: string; answer: string; sources: any[] }>(
      '/api/v1/chat/query',
      {
        method: 'POST',
        body: JSON.stringify({
          query: query.trim(),
          session_id: sessionId || undefined,
        }),
      }
    );
  }

  async getChatHistory(sessionId: string): Promise<{ session_id: string; messages: any[] }> {
    return this.request<{ session_id: string; messages: any[] }>(`/api/v1/chat/${encodeURIComponent(sessionId)}/history`);
  }

  async clearChatHistory(sessionId: string): Promise<{ session_id: string; message: string }> {
    return this.request<{ session_id: string; message: string }>(`/api/v1/chat/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Personalized Activity Recommendations
   */
  async getRecommendations(
    payload: { user_id?: string; [key: string]: any },
    topN: number = 5
  ): Promise<RecommendationResponse> {
    return this.request<RecommendationResponse>(`/api/v1/recommend?top_n=${topN}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * User Profile CRUD (MongoDB users collection)
   */
  async getUser(userId: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/v1/users/${encodeURIComponent(userId)}`);
  }

  async createUser(userData: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, updateData: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/v1/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Participation History (MongoDB participation_history)
   */
  async recordParticipation(
    userId: string,
    data: { activity_id: string; activity_name?: string; date?: string; notes?: string }
  ): Promise<ParticipationItem> {
    return this.request<ParticipationItem>(`/api/v1/users/${encodeURIComponent(userId)}/participation`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserParticipation(userId: string): Promise<{ user_id: string; count: number; history: ParticipationItem[] }> {
    return this.request<{ user_id: string; count: number; history: ParticipationItem[] }>(
      `/api/v1/users/${encodeURIComponent(userId)}/participation`
    );
  }

  /**
   * Activity Registrations (MongoDB registrations)
   */
  async registerForActivity(data: { user_id: string; activity_id: string; status?: string }): Promise<RegistrationItem> {
    return this.request<RegistrationItem>('/api/v1/registrations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserRegistrations(userId: string): Promise<RegistrationItem[]> {
    return this.request<RegistrationItem[]>(`/api/v1/users/${encodeURIComponent(userId)}/registrations`);
  }

  /**
   * Engagement Analysis (Phase 5)
   */
  async getUserEngagement(userId: string): Promise<UserEngagementResponse> {
    return this.request<UserEngagementResponse>(`/api/v1/users/${encodeURIComponent(userId)}/engagement`);
  }

  async getPlatformEngagement(): Promise<PlatformEngagementResponse> {
    return this.request<PlatformEngagementResponse>('/api/v1/analytics/engagement');
  }
}

export const api = new ApiService();
export default api;
