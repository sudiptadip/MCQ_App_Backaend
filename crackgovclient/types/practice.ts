// ── Practice Question with full options ─────────────────────────────────────
export interface PracticeOption {
  id: number;
  option_text: string;
  is_correct?: boolean | null;
}

export interface PracticeQuestion {
  id: number;
  question_text: string;
  difficulty_level?: string;
  category_name?: string;
  is_bookmarked?: boolean;
  image_url?: string | null;
  options: PracticeOption[];
}

// ── LocalStorage session ─────────────────────────────────────────────────────
export interface PracticeSession {
  testId: number;
  testName: string;
  totalQuestions: number;
  durationMinutes: number;
  attemptId: number | null;
  startedAt: string; // ISO string
  answers: Record<number, number>; // questionId → selectedOptionId
  flagged: number[]; // questionIds flagged for review
  completed: boolean;
}

// ── Submit payload ───────────────────────────────────────────────────────────
export interface SubmitAnswerPayload {
  question_id: number;
  selected_option_id: number;
}

export interface SubmitAttemptPayload {
  attempt_id: number;
  answers: SubmitAnswerPayload[];
}

// ── Result returned from backend after submit ─────────────────────────────────
export interface AttemptResult {
  attempt_id: number;
  score: number;
  total_questions: number;
  correct_answers: number;
}

// ── Attempt History ──────────────────────────────────────────────────────────
export interface AttemptHistoryItem {
  attemptId: number;
  testId: number;
  testName: string;
  categoryName: string;
  attemptDate: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  status: 'Pending' | 'Completed';
}

// ── Attempt Review ──────────────────────────────────────────────────────────
export interface ReviewOption {
  id: number;
  optionText: string;
  isCorrect: boolean;
}

export interface ReviewQuestion {
  id: number;
  questionText: string;
  difficultyLevel: string;
  userSelectedOptionId: number | null;
  options: ReviewOption[];
  questionExplanation?: string;
  question_explanation?: string;
  tag?: string;
  tags?: string;
}

export interface AttemptReview {
  attemptId: number;
  testName: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  questions: ReviewQuestion[];
}

// ── Display View ─────────────────────────────────────────────────────────────
export interface DisplayViewNode {
  id: number;
  display_name: string;
  parent_id: number | null;
  assigned_tests?: string | AttemptTest[];
}

export interface AttemptTest {
  id: number;
  test_id: number;
  test_name: string;
  duration_minutes: number;
  total_questions: number;
}

// ── Category with counts ─────────────────────────────────────────────────────
export interface CategoryWithCounts {
  id: number;
  name: string;
  parent_id: number | null;
  direct_question_count: number;
  total_question_count: number;
}

// ── Custom Practice Payload ──────────────────────────────────────────────────
export interface CustomPracticePayload {
  name: string;
  duration_minutes: number;
  question_count: number;
  difficulty_level: string | null;
  filter_mode: 'all' | 'unpracticed' | 'bookmarked';
  category_ids: number[];
}
