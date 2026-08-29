/**
 * BNHS Nature-Engagement Platform — Centralized API Service
 * Connects frontend directly to the MERN Express API Gateway (port 3000),
 * which orchestrates MERN Authentication, MongoDB, and Python AI Microservices.
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
  AdminOverview,
  EligibleLeader,
  EventLeadInvitation,
  AdminUserItem,
  StaffUser,
  AdminEventItem,
  EventParticipant,
  VolunteerEligibility,
  VolunteerOpportunity,
  VolunteerRequest,
  AdminEligibleVolunteer,
  ExperiencePost,
  AttendedActivityOption,
  CommunityComment,
  CommunityMessage,
  CommunityReport,
  MyConversation,
  ActivityImage,
} from '../types';

const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
const API_BASE_URL = envBase !== undefined ? envBase.replace(/\/+$/, '') : '';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const primaryUrl = this.baseUrl ? `${this.baseUrl}${cleanEndpoint}` : cleanEndpoint;
    
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    try {
      let response: Response;
      try {
        response = await fetch(primaryUrl, {
          ...options,
          headers,
          credentials: 'include', // Support MERN JWT cookies
        });
      } catch (fetchErr: any) {
        // If relative URL failed and baseUrl was empty, attempt direct localhost:3000 fallback
        if (!this.baseUrl && cleanEndpoint.startsWith('/api')) {
          response = await fetch(`http://localhost:3000${cleanEndpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
        } else {
          throw fetchErr;
        }
      }
      
      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // ignore json parse error
        }
        const error: any = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      return await response.json() as T;
    } catch (err: any) {
      if (err.name === 'TypeError' && (err.message?.includes('fetch') || err.message?.includes('NetworkError'))) {
        throw new Error(`Unable to connect to Express backend (port 3000). Please make sure the backend server is running via 'node server.js' or 'npm run dev' inside the Backend folder.`);
      }
      throw err;
    }
  }

  // ==========================================
  // 1. MERN Authentication Endpoints
  // ==========================================

  async login(credentials: { email?: string; username?: string; password?: string }): Promise<any> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async registerUser(userData: { username: string; email: string; password?: string }): Promise<any> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async verifyOTP(payload: { email: string; otp: string }): Promise<any> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resendOTP(payload: { email: string }): Promise<any> {
    return this.request('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async logout(): Promise<any> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getMernCurrentUser(): Promise<any> {
    return this.request('/api/user/me');
  }

  // ==========================================
  // 2. Health Check
  // ==========================================

  async checkHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/ai/health');
  }

  // ==========================================
  // 3. Activities Catalog
  // ==========================================

  async getActivities(filters: ActivityFilters = {}): Promise<ActivitiesResponse> {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.type) params.append('type', filters.type);

    const queryString = params.toString();
    const queryPart = queryString ? `?${queryString}` : '';

    return this.request<ActivitiesResponse>(`/api/ai/activities${queryPart}`);
  }

  async getActivityById(activityId: string): Promise<Activity> {
    return this.request<Activity>(`/api/ai/activities/${encodeURIComponent(activityId)}`);
  }

  // ==========================================
  // 4. Personalized Recommendations
  // ==========================================

  async getRecommendations(profile: Partial<UserProfile>, topN: number = 5): Promise<RecommendationResponse> {
    return this.request<RecommendationResponse>(`/api/ai/recommend?top_n=${topN}`, {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  // ==========================================
  // 5. Conversational RAG Assistant
  // ==========================================

  async askAssistant(
    query: string,
    sessionId?: string,
    userProfile?: any,
    activeActivities?: any[],
    pendingActivityId?: string,
    confirmAction?: boolean
  ): Promise<any> {
    return this.request('/api/ai/chat/query', {
      method: 'POST',
      body: JSON.stringify({
        query: query.trim(),
        session_id: sessionId || undefined,
        user_profile: userProfile || undefined,
        active_activities: activeActivities || undefined,
        pending_activity_id: pendingActivityId || undefined,
        confirm_action: confirmAction !== undefined ? confirmAction : undefined,
      }),
    });
  }

  async getChatHistory(sessionId: string): Promise<{ session_id: string; messages: any[] }> {
    return this.request(`/api/ai/chat/${encodeURIComponent(sessionId)}/history`);
  }

  async clearChatHistory(sessionId: string): Promise<{ message: string }> {
    return this.request(`/api/ai/chat/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  }

  async clearChatSession(sessionId: string): Promise<{ message: string }> {
    return this.clearChatHistory(sessionId);
  }

  // ==========================================
  // 6. User Profile Management (MongoDB)
  // ==========================================

  async getUser(userId: string): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/ai/users/${encodeURIComponent(userId)}`);
  }

  async createUser(userData: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>('/api/ai/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    return this.request<UserProfile>(`/api/ai/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // ==========================================
  // 7. Activity Registrations
  // ==========================================

  async getUserRegistrations(userId: string): Promise<RegistrationItem[]> {
    return this.request<RegistrationItem[]>(`/api/ai/users/${encodeURIComponent(userId)}/registrations`);
  }

  async registerForActivity(registration: {
    user_id: string;
    activity_id: string;
    activity_name?: string;
    status?: string;
    notes?: string;
  }): Promise<RegistrationItem> {
    return this.request<RegistrationItem>('/api/ai/registrations', {
      method: 'POST',
      body: JSON.stringify(registration),
    });
  }

  // ==========================================
  // 8. Participation History & Engagement Analysis
  // ==========================================

  async getUserParticipation(userId: string): Promise<{ user_id: string; total_participations: number; history: ParticipationItem[] }> {
    return this.request(`/api/ai/users/${encodeURIComponent(userId)}/participation`);
  }

  async recordParticipation(userId: string, item: {
    activity_id: string;
    activity_name: string;
    date: string;
    notes?: string;
  }): Promise<ParticipationItem> {
    return this.request<ParticipationItem>(`/api/ai/users/${encodeURIComponent(userId)}/participation`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async getUserEngagement(userId: string): Promise<UserEngagementResponse> {
    return this.request<UserEngagementResponse>(`/api/ai/users/${encodeURIComponent(userId)}/engagement`);
  }

  async getPlatformEngagement(): Promise<PlatformEngagementResponse> {
    return this.request<PlatformEngagementResponse>('/api/ai/analytics/engagement');
  }

  // ==========================================
  // 9. Unified Staff & Admin Platform Management
  // ==========================================

  async getAdminOverview(): Promise<AdminOverview> {
    return this.request<AdminOverview>('/api/admin/overview');
  }

  async getEligibleLeaders(): Promise<{ count: number; eligibleLeaders: EligibleLeader[] }> {
    return this.request<{ count: number; eligibleLeaders: EligibleLeader[] }>('/api/admin/eligible-leaders');
  }

  async sendEventLeadInvitation(payload: { userId: string; eventId: string; message?: string }): Promise<{ message: string; invitation: EventLeadInvitation }> {
    return this.request<{ message: string; invitation: EventLeadInvitation }>('/api/admin/event-lead-invitations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAllInvitations(): Promise<{ count: number; invitations: EventLeadInvitation[] }> {
    return this.request<{ count: number; invitations: EventLeadInvitation[] }>('/api/admin/event-lead-invitations');
  }

  async getAdminUsers(params?: { search?: string; role?: string; location?: string }): Promise<{ count: number; users: AdminUserItem[] }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ count: number; users: AdminUserItem[] }>(`/api/admin/users${query ? `?${query}` : ''}`);
  }

  async getAdminStaff(): Promise<{ count: number; staff: StaffUser[] }> {
    return this.request<{ count: number; staff: StaffUser[] }>('/api/admin/staff');
  }

  async getAdminEvents(): Promise<{ count: number; events: AdminEventItem[] }> {
    return this.request<{ count: number; events: AdminEventItem[] }>('/api/admin/events');
  }

  async searchEventImage(payload: {
    title?: string;
    name?: string;
    description?: string;
    type?: string;
    tags?: string[];
    location?: string;
    excludeUrls?: string[];
  }): Promise<{ success: boolean; image: ActivityImage; query: string; automaticallySelected: boolean; relevanceScore?: number }> {
    return this.request('/api/admin/events/search-image', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createAdminEvent(payload: Partial<AdminEventItem>): Promise<{ message: string; event: AdminEventItem }> {
    return this.request<{ message: string; event: AdminEventItem }>('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAdminEvent(id: string, payload: Partial<AdminEventItem>): Promise<{ message: string; event: AdminEventItem }> {
    return this.request<{ message: string; event: AdminEventItem }>(`/api/admin/events/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteAdminEvent(id: string): Promise<{ message: string; event: AdminEventItem }> {
    return this.request<{ message: string; event: AdminEventItem }>(`/api/admin/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async getAdminEventParticipants(id: string): Promise<{ count: number; participants: EventParticipant[] }> {
    return this.request<{ count: number; participants: EventParticipant[] }>(`/api/admin/events/${encodeURIComponent(id)}/participants`);
  }

  // ==========================================
  // 10. User Event-Lead Invitations
  // ==========================================

  async getMyInvitations(): Promise<{ count: number; invitations: EventLeadInvitation[] }> {
    return this.request<{ count: number; invitations: EventLeadInvitation[] }>('/api/user/event-lead-invitations');
  }

  async acceptLeadInvitation(invitationId: string): Promise<{ message: string; invitation: EventLeadInvitation }> {
    return this.request<{ message: string; invitation: EventLeadInvitation }>(`/api/user/event-lead-invitations/${encodeURIComponent(invitationId)}/accept`, {
      method: 'POST',
    });
  }

  async declineLeadInvitation(invitationId: string): Promise<{ message: string; invitation: EventLeadInvitation }> {
    return this.request<{ message: string; invitation: EventLeadInvitation }>(`/api/user/event-lead-invitations/${encodeURIComponent(invitationId)}/decline`, {
      method: 'POST',
    });
  }

  // ==========================================
  // 11. Role-Based Volunteering Workflows
  // ==========================================

  async getVolunteerEligibility(): Promise<VolunteerEligibility> {
    return this.request<VolunteerEligibility>('/api/user/volunteer/eligibility');
  }

  async getVolunteerOpportunities(): Promise<{ count: number; opportunities: VolunteerOpportunity[] }> {
    return this.request<{ count: number; opportunities: VolunteerOpportunity[] }>('/api/user/volunteer/opportunities');
  }

  async getMyVolunteerRequests(): Promise<{ count: number; requests: VolunteerRequest[] }> {
    return this.request<{ count: number; requests: VolunteerRequest[] }>('/api/user/volunteer/my-requests');
  }

  async applyForVolunteer(payload: {
    opportunityId: string;
    opportunityTitle: string;
    opportunityLocation?: string;
    opportunityTheme?: string;
    message?: string;
  }): Promise<{ message: string; application: VolunteerRequest }> {
    return this.request<{ message: string; application: VolunteerRequest }>('/api/user/volunteer/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async userAcceptVolunteerRequest(requestId: string): Promise<{ message: string; request: VolunteerRequest }> {
    return this.request<{ message: string; request: VolunteerRequest }>(`/api/user/volunteer/requests/${encodeURIComponent(requestId)}/accept`, {
      method: 'POST',
    });
  }

  async userDeclineVolunteerRequest(requestId: string): Promise<{ message: string; request: VolunteerRequest }> {
    return this.request<{ message: string; request: VolunteerRequest }>(`/api/user/volunteer/requests/${encodeURIComponent(requestId)}/decline`, {
      method: 'POST',
    });
  }

  // Admin Volunteer Management
  async getAdminEligibleVolunteers(): Promise<{ count: number; eligibleUsers: AdminEligibleVolunteer[] }> {
    return this.request<{ count: number; eligibleUsers: AdminEligibleVolunteer[] }>('/api/admin/volunteer/eligible-users');
  }

  async getAdminVolunteerRequests(): Promise<{ count: number; requests: VolunteerRequest[] }> {
    return this.request<{ count: number; requests: VolunteerRequest[] }>('/api/admin/volunteer/requests');
  }

  async adminSendVolunteerRequest(payload: {
    userId: string;
    opportunityId: string;
    opportunityTitle: string;
    opportunityLocation?: string;
    message?: string;
  }): Promise<{ message: string; request: VolunteerRequest }> {
    return this.request<{ message: string; request: VolunteerRequest }>('/api/admin/volunteer/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async adminAcceptVolunteerRequest(requestId: string): Promise<{ message: string; request: VolunteerRequest }> {
    return this.request<{ message: string; request: VolunteerRequest }>(`/api/admin/volunteer/requests/${encodeURIComponent(requestId)}/accept`, {
      method: 'POST',
    });
  }

  async adminDeclineVolunteerRequest(requestId: string): Promise<{ message: string; request: VolunteerRequest }> {
    return this.request<{ message: string; request: VolunteerRequest }>(`/api/admin/volunteer/requests/${encodeURIComponent(requestId)}/decline`, {
      method: 'POST',
    });
  }

  // ==========================================
  // 11. Community Feed, Experiences & Group Chat
  // ==========================================

  async getCommunityFeed(params?: {
    category?: string;
    theme?: string;
    sort?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ total: number; page: number; totalPages: number; posts: ExperiencePost[] }> {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.theme) query.append('theme', params.theme);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    return this.request(`/api/community/feed${queryString ? `?${queryString}` : ''}`);
  }

  async getAttendedActivitiesForPost(): Promise<{ count: number; activities: AttendedActivityOption[] }> {
    return this.request('/api/community/attended-activities');
  }

  async createExperiencePost(payload: {
    activityId: string;
    content: string;
    imageUrls?: string[];
  }): Promise<{ message: string; post: ExperiencePost }> {
    return this.request('/api/community/experiences', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getExperiencePost(id: string): Promise<ExperiencePost> {
    return this.request(`/api/community/experiences/${encodeURIComponent(id)}`);
  }

  async addExperienceComment(postId: string, content: string): Promise<{ message: string; comment: CommunityComment; commentsCount: number }> {
    return this.request(`/api/community/experiences/${encodeURIComponent(postId)}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async toggleExperienceReaction(postId: string, type: string = 'like'): Promise<{ isLiked: boolean; reactionType: string | null; reactionsCount: number }> {
    return this.request(`/api/community/experiences/${encodeURIComponent(postId)}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  }

  async deleteExperiencePost(postId: string): Promise<{ message: string; postId: string }> {
    return this.request(`/api/community/experiences/${encodeURIComponent(postId)}`, {
      method: 'DELETE',
    });
  }

  async getMyExperiences(): Promise<{ count: number; posts: ExperiencePost[] }> {
    return this.request('/api/community/my-experiences');
  }

  // Activity Group Chat
  async getActivityChatInfo(activityId: string): Promise<{
    activity: {
      id: string;
      _id: string;
      name: string;
      title?: string;
      category?: string;
      type?: string;
      location?: string;
      date?: string;
      rawDate?: string;
      difficulty?: string;
      capacity?: number;
      participantCount: number;
      status?: string;
      description?: string;
    };
    permissions: {
      canChat: boolean;
      isRegistered: boolean;
      isAttended: boolean;
      isStaffOrAdmin: boolean;
    };
  }> {
    return this.request(`/api/community/activity/${encodeURIComponent(activityId)}`);
  }

  async getActivityMessages(activityId: string, before?: string, limit: number = 50): Promise<{
    activityId: string;
    count: number;
    hasMore?: boolean;
    messages: CommunityMessage[];
  }> {
    const params = new URLSearchParams();
    if (before) params.append('before', before);
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/community/activity/${encodeURIComponent(activityId)}/messages${query}`);
  }

  async getMyConversations(): Promise<{
    success: boolean;
    count: number;
    conversations: MyConversation[];
  }> {
    return this.request('/api/community/my-conversations');
  }

  async markConversationRead(activityId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/community/activity/${encodeURIComponent(activityId)}/read`, {
      method: 'POST',
    });
  }

  async sendActivityMessage(activityId: string, payload: {
    message: string;
    imageUrls?: string[];
  }): Promise<{ message: string; chatMessage: CommunityMessage }> {
    return this.request(`/api/community/activity/${encodeURIComponent(activityId)}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Image Upload helper (via FormData)
  async uploadImages(formData: FormData): Promise<{ message: string; urls: string[] }> {
    const url = `${this.baseUrl}/api/community/upload-images`;
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Image upload failed');
    }
    return res.json();
  }

  // Moderation & Reports
  async createCommunityReport(payload: {
    targetType: 'post' | 'comment' | 'message';
    targetId: string;
    reason: string;
    details?: string;
    postId?: string;
    activityId?: string;
  }): Promise<{ message: string; reportId: string }> {
    return this.request('/api/community/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminCommunityReports(status: string = 'pending'): Promise<{ count: number; reports: CommunityReport[] }> {
    return this.request(`/api/community/admin/reports?status=${encodeURIComponent(status)}`);
  }

  async resolveAdminCommunityReport(reportId: string, payload: {
    action: 'dismiss' | 'remove_post' | 'hide_post';
    adminNotes?: string;
  }): Promise<{ message: string; report: CommunityReport }> {
    return this.request(`/api/community/admin/reports/${encodeURIComponent(reportId)}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
export default api;

