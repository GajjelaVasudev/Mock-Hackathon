export interface ActivityImage {
  url: string;
  mediumUrl?: string;
  smallUrl?: string;
  source?: string;
  photographer?: string;
  attributionUrl?: string;
  alt?: string;
}

export interface Activity {
  id: string;
  _id?: string;
  name: string;
  title?: string;
  category?: string;
  location: string;
  interests?: string[];
  tags?: string[];
  difficulty?: string;
  audience?: string[];
  duration?: string;
  distance?: string;
  description: string;
  species?: string[];
  type: string;
  date?: string;
  capacity?: number;
  registeredCount?: number;
  leader?: string | null;
  status?: 'draft' | 'upcoming' | 'open' | 'ongoing' | 'full' | 'completed' | 'cancelled' | string;
  image?: ActivityImage | null;
  imageUrl?: string | null;
}

export interface ActivitiesResponse {
  count: number;
  source: string;
  activities: Activity[];
}

export interface Recommendation {
  activity_id?: string;
  activity: string;
  category?: string;
  location?: string;
  type?: string;
  difficulty?: string;
  duration?: string;
  distance?: string;
  description?: string;
  score: number;
  reasons: string[];
}

export interface RecommendationResponse {
  user_id?: string;
  recommendations: Recommendation[];
}

export interface UserProfile {
  id: string;
  user_id?: string;
  username?: string;
  name: string;
  email?: string;
  role?: string;
  age_group: string;
  location: string;
  interests: string[];
  experience_level: string;
  preferred_activity_type?: string | null;
  previous_activities?: string[];
  badges?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RegistrationItem {
  id: string;
  user_id: string;
  activity_id: string;
  activity_name?: string;
  status: string;
  created_at?: string;
}

export interface ParticipationItem {
  id?: string;
  user_id: string;
  activity_id: string;
  activity_name: string;
  date?: string;
  created_at?: string;
}

export interface ChatActivityCardData {
  id: string;
  _id?: string;
  name?: string;
  title?: string;
  category?: string;
  type: string;
  location: string;
  date?: string;
  difficulty?: string;
  duration?: string;
  description: string;
  tags?: string[];
  capacity?: number;
  registeredCount?: number;
  status?: string;
  matchPercentage?: number;
  matchReasons?: string[];
  isRegistered?: boolean;
  isFull?: boolean;
}

export interface PendingRegistrationData {
  activityId: string;
  activityTitle: string;
  date?: string;
  location?: string;
  type?: string;
  difficulty?: string;
}

export interface RegistrationResultData {
  status: 'confirmed' | 'failed' | 'already_registered' | 'full' | 'cancelled' | string;
  bookingId?: string;
  activityId?: string;
  activityTitle?: string;
  date?: string;
  location?: string;
  message?: string;
}

export interface SourceCitation {
  document: string;
  page: number | string;
  section: string;
}

export interface PendingVolunteerData {
  opportunityId: string;
  opportunityTitle: string;
  opportunityLocation: string;
  commitment?: string;
  theme?: string;
}

export interface VolunteerResultData {
  opportunityTitle: string;
  opportunityLocation: string;
  status: string;
  applicationId?: string;
  message?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceCitation[];
  timestamp?: string;
  isError?: boolean;
  intent?: string;
  activities?: ChatActivityCardData[];
  pendingRegistration?: PendingRegistrationData;
  registrationResult?: RegistrationResultData;
  pendingVolunteer?: PendingVolunteerData;
  volunteerResult?: VolunteerResultData;
}

export interface HealthStatus {
  status: string;
  services: {
    rag: string;
    recommendation: string;
    mongodb: string;
  };
}

export interface ActivityFilters {
  category?: string;
  location?: string;
  difficulty?: string;
  type?: string;
  search?: string;
}

export interface CategoryEngagement {
  category: string;
  count: number;
  percentage: number;
}

export interface TypeEngagement {
  type: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  activity_name?: string;
  category?: string;
  date?: string;
}

export interface NatureJourneyStage {
  current_stage: string;
  completed_categories: string[];
  next_suggested_category?: string;
}

export interface EngagementSummary {
  engagement_score: number;
  engagement_level: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  total_registrations: number;
  total_participations: number;
  completion_rate: number;
  participation_frequency?: {
    activities_per_month?: number;
    status?: string;
  };
  most_engaged_category?: string;
  most_engaged_type?: string;
  engagement_trend: 'INCREASING' | 'STABLE' | 'DECREASING' | 'INSUFFICIENT_DATA';
}

export interface UserEngagementResponse {
  user_id: string;
  summary: EngagementSummary;
  category_distribution: CategoryEngagement[];
  type_distribution: TypeEngagement[];
  recent_activity?: RecentActivity;
  journey: NatureJourneyStage;
  insights: string[];
}

export interface PlatformEngagementResponse {
  total_users: number;
  total_registrations: number;
  total_participations: number;
  completion_rate: number;
  most_popular_categories: Array<{ category: string; participations: number }>;
  most_popular_activity_types: Array<{ type: string; participations: number }>;
  engagement_distribution: Record<string, number>;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  staffCount: number;
  totalEvents: number;
  totalRegistrations: number;
  totalParticipations: number;
  eligibleLeadersCount: number;
}

export interface EligibleLeader {
  userId: string;
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  location: string;
  interests: string[];
  experienceLevel?: string;
  attendedEvents: number;
  previous_activities: string[];
  hasPendingInvitation?: boolean;
  pendingInvitationId?: string | null;
}

export interface EventLeadInvitation {
  _id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  eventId: string;
  eventTitle: string;
  eventLocation?: string;
  eventDate?: string;
  invitedBy?: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface AdminUserItem {
  id: string;
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  location: string;
  interests: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  attendedEvents: number;
  registeredEvents: number;
  engagementScore: number;
  isEligibleLeader: boolean;
  createdAt: string;
}

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  eventsManaged: number;
  eventsLed: number;
  status: string;
}

export interface EventParticipant {
  id: string;
  name: string;
  email: string;
  registrationStatus: string;
  registeredAt: string;
}

export interface AdminEventItem {
  id: string;
  _id: string;
  title: string;
  name: string;
  description: string;
  type: string;
  tags: string[];
  interests: string[];
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
  leader?: string | null;
  status: 'draft' | 'upcoming' | 'open' | 'ongoing' | 'full' | 'completed' | 'cancelled' | string;
  difficulty?: string;
  duration?: string;
  image?: ActivityImage | null;
  imageUrl?: string | null;
}

// Volunteering Interfaces
export interface VolunteerEligibility {
  userId: string;
  userName?: string;
  username?: string;
  email?: string;
  role: 'admin' | 'staff' | 'user' | string;
  attendedEvents: number;
  requiredEvents: number;
  eligible: boolean;
  remainingEvents: number;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  theme: string;
  role: string;
  skills: string[];
  commitment: string;
  location: string;
  idealFor: string;
  activityId?: string;
  description: string;
  matchScore?: number;
}

export interface VolunteerRequest {
  _id: string;
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  opportunityId: string;
  opportunityTitle: string;
  opportunityLocation?: string;
  opportunityTheme?: string;
  message?: string;
  type: 'user_application' | 'admin_request';
  invitedBy?: string | null;
  attendedEvents?: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
  respondedAt?: string;
}

export interface AdminEligibleVolunteer {
  id: string;
  userId: string;
  name: string;
  username: string;
  email: string;
  role: string;
  location: string;
  interests: string[];
  attendedEvents: number;
  eligible: boolean;
  hasPendingRequest?: boolean;
  pendingRequestId?: string | null;
}

// ==========================================
// Community & Group Chat Types
// ==========================================

export interface CommunityComment {
  _id: string;
  user: string | { _id: string; name: string; username?: string; role?: string; avatar?: string };
  userName: string;
  userRole?: string;
  content: string;
  createdAt: string;
}

export interface CommunityReaction {
  user: string;
  type: string;
  createdAt?: string;
}

export interface ExperiencePost {
  _id: string;
  id?: string;
  user: { _id: string; name: string; username?: string; role?: string; avatar?: string } | string;
  userName: string;
  userRole: string;
  activity: { _id: string; name?: string; title?: string; id?: string; location?: string; category?: string; type?: string } | string;
  activityIdString?: string;
  activityName: string;
  activityDate?: string;
  activityLocation?: string;
  activityCategory?: string;
  activityType?: string;
  isAttendedVerified: boolean;
  content: string;
  imageUrls: string[];
  reactionsCount: number;
  commentsCount: number;
  comments?: CommunityComment[];
  isLiked?: boolean;
  userReactionType?: string | null;
  isOwner?: boolean;
  reportsCount?: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityMessage {
  _id: string;
  id?: string;
  activity: string | { _id: string; name?: string; title?: string; id?: string };
  activityIdString?: string;
  user: { _id: string; name: string; username?: string; role?: string; avatar?: string } | string;
  userName: string;
  userRole: string;
  message: string;
  imageUrls?: string[];
  isCurrentUser?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityReport {
  _id: string;
  reporter: { _id: string; name: string; email?: string };
  reporterName: string;
  targetType: 'post' | 'comment' | 'message';
  targetId: string;
  post?: ExperiencePost;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned';
  adminNotes?: string;
  createdAt: string;
}

export interface AttendedActivityOption {
  id: string;
  _id: string;
  name: string;
  title?: string;
  category?: string;
  type?: string;
  location?: string;
  date?: string;
  rawDate?: string;
  status?: string;
}

export interface ConversationLastMessage {
  id: string;
  text: string;
  senderName: string;
  senderRole?: string;
  isCurrentUser: boolean;
  hasImages: boolean;
  imageCount: number;
  firstImageUrl?: string | null;
  createdAt: string;
}

export interface MyConversation {
  activityId: string;
  activityMongoId: string;
  activityTitle: string;
  activityDate: string;
  rawDate?: string;
  location: string;
  category: string;
  type: string;
  status: string;
  participantCount: number;
  messageCount: number;
  unreadCount: number;
  lastMessage: ConversationLastMessage;
}


