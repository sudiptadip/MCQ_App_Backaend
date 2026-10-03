import api from '../../../lib/axios';
import { API_ROUTES } from '../../../constants/apiRoute';
import type apiResponse from '../../../types/apiResponse';
import type { AttemptResult, SubmitAttemptPayload, AttemptHistoryItem, AttemptReview } from '../../../types/practice';

import type { PracticeQuestion } from '../../../types/practice';

// ── Fetch full test with all questions + options ──────────────────────────────
// Step 1: getTestById → gets test metadata + question IDs (no options)
// Step 2: fetch each question with options in parallel via getQuestionAnsById
export const fetchTestWithQuestions = async (
  testId: number,
): Promise<{
  testName: string;
  durationMinutes: number;
  totalQuestions: number;
  minAttempt: number;
  questions: PracticeQuestion[];
}> => {
  const response = await api.post(API_ROUTES.GET_FULL_TEST_DETAILS, { id: testId });
  const result = response.data;

  if (!result.isSuccess || !result.data) {
    throw new Error(result.message || 'Failed to fetch test details');
  }

  const { test, questions: rawQuestions } = result.data;

  const questions: PracticeQuestion[] = rawQuestions.map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    difficulty_level: q.difficulty_level,
    category_name: q.category_name,
    is_bookmarked: !!q.is_bookmarked,
    image_url: q.image_url || null,
    options: (q.options || []).map((o: any) => ({
      id: o.id,
      option_text: o.option_text,
      is_correct: o.is_correct,
    })),
  }));

  return {
    testName: test.name,
    durationMinutes: test.duration_minutes,
    totalQuestions: test.total_questions,
    minAttempt: Number(test.min_no_of_question_attempt ?? 0),
    questions,
  };
};

// ── Create an attempt record on the backend ───────────────────────────────────
// Backend SP: SpAttempt/1
// Payload:    { test_id }
// Returns:    { id, student_id, test_id, score, started_at }
export const startAttempt = async (
  test_id: number,
): Promise<apiResponse<{ id: number }>> => {
  const response = await api.post(API_ROUTES.START_ATTEMPT, { test_id });
  return response.data;
};

// ── Submit all answers at once ────────────────────────────────────────────────
// Backend SP: SpAttempt/2
// Payload:    { attempt_id, answers: [{ question_id, selected_option_id }] }
// Returns:    { attempt_id, score, total_questions, correct_answers }
export const submitAttempt = async (
  payload: SubmitAttemptPayload,
): Promise<apiResponse<AttemptResult>> => {
  const response = await api.post(API_ROUTES.SUBMIT_ATTEMPT, payload);
  return response.data;
};
// ── Fetch history of all attempts for the current student ─────────────────────
// Backend SP: SpAttempt/4
export const fetchPracticeHistory = async (): Promise<apiResponse<AttemptHistoryItem[]>> => {
  const response = await api.post(API_ROUTES.GET_ATTEMPT_HISTORY, {});
  return response.data;
};

// ── Fetch detailed review for a specific attempt ──────────────────────────────
// Backend SP: SpAttempt/3
export const fetchAttemptReview = async (attemptId: number): Promise<apiResponse<AttemptReview>> => {
  const response = await api.post(API_ROUTES.GET_ATTEMPT_REVIEW, { attempt_id: attemptId });
  return response.data;
};

// ── Toggle Bookmark for a question ───────────────────────────────────────────
// Backend SP: SpTest/6
export const toggleBookmark = async (
  questionId: number,
): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.TOGGLE_BOOKMARK, { question_id: questionId });
  return response.data;
};

export interface CustomPracticePayload {
  name: string;
  duration_minutes: number;
  question_count: number;
  difficulty_level: string | null;
  filter_mode: 'all' | 'unpracticed' | 'bookmarked';
  category_ids: number[];
}

export const createCustomPractice = async (
  payload: CustomPracticePayload,
): Promise<apiResponse<{ test_id: number }>> => {
  const response = await api.post(API_ROUTES.CREATE_CUSTOM_PRACTICE, payload);
  return response.data;
};

