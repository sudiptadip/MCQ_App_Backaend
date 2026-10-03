export interface LeaderboardEntry {
  rank: number;
  student_user_id: number;
  student_name: string;
  email?: string;
  franchise_name?: string;
  total_attempts: number;
  total_questions_solved: number;
  total_correct: number;
  total_marks: number;
  average_accuracy: number;
  total_time_spent_seconds?: number;
}

export interface LeaderboardFilters {
  time_range: 'today' | 'week' | 'month' | 'all';
  franchise_id?: number | null;
  sort_by: 'marks' | 'practice';
}
