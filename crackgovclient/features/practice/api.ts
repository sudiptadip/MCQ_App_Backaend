import { fetchApi } from '@/lib/api';
import type {
  AttemptResult,
  SubmitAttemptPayload,
  AttemptHistoryItem,
  AttemptReview,
  PracticeQuestion,
  DisplayViewNode,
  CategoryWithCounts,
  CustomPracticePayload,
} from '@/types/practice';

const AUTH_ALL = 'execute-sp/auth-all';

// ── Display Views ─────────────────────────────────────────────────────────────
export const getDisplayViewsForStudent = async (): Promise<DisplayViewNode[]> => {
  const res = await fetchApi(`/${AUTH_ALL}/SpDisplayView/7`, { method: 'POST', body: JSON.stringify({}) });
  if (!res.isSuccess) throw new Error(res.message || 'Failed to fetch practice modules');
  return res.data || [];
};

export const getDisplayViewTree = async (nodeId: number): Promise<DisplayViewNode[]> => {
  const res = await fetchApi(`/${AUTH_ALL}/SpDisplayView/4`, { method: 'POST', body: JSON.stringify({ id: nodeId }) });
  if (!res.isSuccess) throw new Error(res.message || 'Failed to fetch folder');
  return res.data || [];
};

// ── Test + Questions ──────────────────────────────────────────────────────────
export const fetchTestWithQuestions = async (testId: number): Promise<{
  testName: string;
  durationMinutes: number;
  totalQuestions: number;
  minAttempt: number;
  questions: PracticeQuestion[];
}> => {
  const res = await fetchApi(`/${AUTH_ALL}/SpTest/5`, { method: 'POST', body: JSON.stringify({ id: testId }) });
  if (!res.isSuccess || !res.data) throw new Error(res.message || 'Failed to fetch test details');

  const { test, questions: rawQuestions } = res.data;

  const questions: PracticeQuestion[] = rawQuestions.map((q: Record<string, unknown>) => ({
    id: q.id,
    question_text: q.question_text,
    difficulty_level: q.difficulty_level,
    category_name: q.category_name,
    is_bookmarked: !!q.is_bookmarked,
    image_url: (q.image_url as string) || null,
    options: ((q.options as Record<string, unknown>[]) || []).map((o: Record<string, unknown>) => ({
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

// ── Attempt Lifecycle ─────────────────────────────────────────────────────────
export const startAttempt = async (test_id: number): Promise<{ isSuccess: boolean; data?: { id: number }; message?: string }> => {
  return fetchApi(`/${AUTH_ALL}/SpAttempt/1`, { method: 'POST', body: JSON.stringify({ test_id }) });
};

export const submitAttempt = async (payload: SubmitAttemptPayload): Promise<{ isSuccess: boolean; data?: AttemptResult; message?: string }> => {
  return fetchApi(`/${AUTH_ALL}/SpAttempt/2`, { method: 'POST', body: JSON.stringify(payload) });
};

export const fetchAttemptReview = async (attemptId: number): Promise<{ isSuccess: boolean; data?: AttemptReview; message?: string }> => {
  return fetchApi(`/${AUTH_ALL}/SpAttempt/3`, { method: 'POST', body: JSON.stringify({ attempt_id: attemptId }) });
};

export const fetchPracticeHistory = async (): Promise<{ isSuccess: boolean; data?: AttemptHistoryItem[]; message?: string }> => {
  return fetchApi(`/${AUTH_ALL}/SpAttempt/4`, { method: 'POST', body: JSON.stringify({}) });
};

// ── Bookmark ──────────────────────────────────────────────────────────────────
export const toggleBookmark = async (questionId: number): Promise<{ isSuccess: boolean; message?: string }> => {
  return fetchApi(`/${AUTH_ALL}/SpTest/6`, { method: 'POST', body: JSON.stringify({ question_id: questionId }) });
};

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategoriesWithQuestionCounts = async (): Promise<CategoryWithCounts[]> => {
  const res = await fetchApi(`/${AUTH_ALL}/SpCategories/8`, { method: 'POST', body: JSON.stringify({}) });
  if (!res.isSuccess) throw new Error(res.message || 'Failed to fetch categories');
  return res.data || [];
};

// ── Custom Practice ───────────────────────────────────────────────────────────
export const createCustomPractice = async (payload: CustomPracticePayload): Promise<{ isSuccess: boolean; data?: { test_id: number }; message?: string }> => {
  return fetchApi(`/${AUTH_ALL}/SpTest/8`, { method: 'POST', body: JSON.stringify(payload) });
};
