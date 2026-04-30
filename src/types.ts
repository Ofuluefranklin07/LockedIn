export type AcademicLevel = 'secondary school' | 'undergraduate' | 'postgraduate' | 'other';
export type GoalCategory = 'academic' | 'health' | 'personal';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  academicLevel: AcademicLevel;
  fieldOfStudy: string;
  currentStreak: number;
  longestStreak: number;
  lastLogDate?: string; // YYYY-MM-DD
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  category: GoalCategory;
  deadline: string;
  priority: PriorityLevel;
  createdAt: string;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  hoursStudied: number;
  focusLevel: number;
  tasksCompletedCount: number;
}
