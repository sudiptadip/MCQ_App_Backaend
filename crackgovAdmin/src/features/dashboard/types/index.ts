export interface SystemActivityItem {
  type: 'student_registered' | 'test_created' | 'test_attempted' | string;
  title: string;
  description: string;
  timestamp: string;
}

export interface AdminDashboardData {
  total_students: number;
  total_questions: number;
  active_tests: number;
  total_attempts: number;
  avg_completion_rate: number;
  total_study_materials: number;
  recent_activities: SystemActivityItem[];
}

export interface StudentDashboardData {
  total_attempts: number;
  success_rate: number;
  accuracy_percentage: number;
  practice_time_minutes: number;
  recent_attempts: {
    attempt_id: number;
    test_name: string;
    score: number;
    total_questions: number;
    started_at: string;
    completed_at: string | null;
  }[];
}
