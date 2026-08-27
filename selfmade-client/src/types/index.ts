export interface User {
  id: number;
  username: string;
  email: string;
}

export interface UserProfile {
  id?: number;
  userId?: number;
  learningTrack: string;
  currentLevel?: string;
  freeTimeStart: string; // Формат "HH:mm:ss"
  freeTimeEnd: string;
  sleepTime: string;
  preferredRest: string;
  dislikedRest?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  type: string;
}

export interface Activity {
  id: number;
  userId?: number;
  categoryId: number;
  categoryName?: string | null;
  title: string;
  description: string;
  durationMinutes: number;
  createdAt: string;
}

export interface Mood {
  id: number;
  score: number;
  note: string;
  createdAt: string;
}

export interface UserInterest {
  id: number;
  categoryId: number;
  title: string;
  isDevelopmentGoal: boolean;
}

export interface GoalPlanStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  completedAt: string | null;
}

export interface PendingStep {
  goalId: number;
  stepId: number;
  goalTitle: string;
  categoryId: number;
  title: string;
  description: string;
}

export interface DailyInsightResponse {
  insight: string | null;
}

export interface GoalProgress {
  goalId: number;
  goalTitle: string;
  totalSteps: number;
  completedSteps: number;
}

export interface Achievement {
  goalTitle: string;
  title: string;
  completedAt: string | null;
}

export interface UserSummary {
  goalsProgress: GoalProgress[];
  achievements: Achievement[];
  totalActivities: number;
  totalMinutes: number;
}