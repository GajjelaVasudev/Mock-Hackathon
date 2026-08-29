export interface Activity {
  id: string;
  name: string;
  category: string;
  location: string;
  interests: string[];
  difficulty?: string;
  audience?: string[];
  duration?: string;
  distance?: string;
  description: string;
  species?: string[];
  type: 'walk' | 'camp' | 'course' | 'volunteer';
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
  username?: string;
  name: string;
  email?: string;
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

export interface SourceCitation {
  document: string;
  page: number | string;
  section: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceCitation[];
  timestamp?: string;
  isError?: boolean;
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
