import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type apiResponse from "../../../types/apiResponse";
import type { Question } from "../../../types/database/Question";
import type { QuestionOption } from "../../../types/database/Options";

export interface QuestionWithDetails {
  // Support both nested and flat responses
  question?: Question & { 
      category_name?: string;
      root_category_id?: number;
      parent_category_id?: number;
      total_count?: number;
      upload_lot_number?: number | null;
      sheet_name?: string | null;
  };
  id?: number;
  question_text?: string;
  category_id?: number;
  category_name?: string;
  difficulty_level?: string;
  question_explanation?: string;
  tag?: string;
  root_category_id?: number;
  parent_category_id?: number;
  total_count?: number;
  upload_lot_number?: number | null;
  sheet_name?: string | null;
  image_url?: string | null;
  image_document_id?: number | null;
  options: QuestionOption[];
}

export interface UpsertQuestionPayload {
  question: Partial<Question>;
  options: Partial<QuestionOption>[];
}

export interface BulkUpsertQuestionPayload {
  questions: UpsertQuestionPayload[];
  lot_number?: number | null;
  sheet_name?: string | null;
}

export interface GetQuestionAnsListParams {
  pageSize?: number;
  cursor?: number | null;
  direction?: 'next' | 'prev';
  searchKeyword?: string;
  lot_number?: number | null;
  includeTotalCount?: boolean | number;
  pageNumber?: number;
}

export interface QuestionListResponse {
  questions: QuestionWithDetails[];
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startCursor: number | null;
  endCursor: number | null;
}

export const getQuestionAnsList = async (
  params?: GetQuestionAnsListParams
): Promise<QuestionListResponse> => {
  const response = await api.post(API_ROUTES.GET_QUESTION_ANS_LIST, params || {});
  if (response.data.isSuccess) {
    const resData = response.data?.data;
    if (Array.isArray(resData)) {
      const totalCount = resData.length > 0 ? (resData[0]?.question?.total_count ?? resData[0]?.total_count ?? 0) : 0;
      return {
        questions: resData,
        totalCount,
        hasNextPage: false,
        hasPrevPage: false,
        startCursor: resData.length > 0 ? (resData[0]?.question?.id ?? resData[0]?.id ?? null) : null,
        endCursor: resData.length > 0 ? (resData[resData.length - 1]?.question?.id ?? resData[resData.length - 1]?.id ?? null) : null,
      };
    }

    const items = (resData?.items || []) as QuestionWithDetails[];
    const totalCount = resData?.totalCount ?? (items.length > 0 ? (items[0]?.question?.total_count ?? items[0]?.total_count ?? 0) : 0);
    return {
      questions: items,
      totalCount,
      hasNextPage: Boolean(resData?.hasNextPage),
      hasPrevPage: Boolean(resData?.hasPrevPage),
      startCursor: resData?.startCursor ?? (items.length > 0 ? (items[0]?.question?.id ?? items[0]?.id ?? null) : null),
      endCursor: resData?.endCursor ?? (items.length > 0 ? (items[items.length - 1]?.question?.id ?? items[items.length - 1]?.id ?? null) : null),
    };
  }
  throw new Error(response.data.message || "Failed to fetch question list");
};

export const upsertQuestionAns = async (payload: UpsertQuestionPayload): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.UPSERT_QUESTION_ANS, payload);
  return response.data;
};

export const deleteQuestionAns = async (id: number): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.DELETE_QUESTION_ANS, { id });
  return response.data;
};

export const getQuestionAnsById = async (id: number): Promise<QuestionWithDetails> => {
  const response = await api.post(API_ROUTES.GET_QUESTION_ANS_BY_ID, { id });
  if (response.data.isSuccess) {
    return response.data?.data as QuestionWithDetails;
  }
  throw new Error(response.data.message || "Failed to fetch question details");
};

export const bulkUpsertQuestionAns = async (
  payload: UpsertQuestionPayload[] | BulkUpsertQuestionPayload
): Promise<apiResponse<any>> => {
  const body = Array.isArray(payload) ? { questions: payload } : payload;
  const response = await api.post(API_ROUTES.BULK_UPSERT_QUESTION_ANS, body);
  return response.data;
};

// ==========================================
// ADVANCED DELETE (SUPER ADMIN ONLY)
// ==========================================

export interface LotSummaryItem {
  lot_number: number;
  sheet_name: string | null;
  total_questions: number;
  first_uploaded_at: string;
  last_uploaded_at: string;
  linked_tests_count: number;
  linked_attempts_count: number;
  linked_bookmarks_count: number;
}

export interface DuplicateOptionItem {
  id: number;
  option_text: string;
  is_correct: boolean;
}

export interface DuplicateQuestionItem {
  id: number;
  question_text: string;
  category_id: number;
  category_name: string;
  difficulty_level: string;
  upload_lot_number: number | null;
  sheet_name: string | null;
  created_at: string;
  linked_tests_count: number;
  linked_attempts_count: number;
  linked_bookmarks_count: number;
  options: DuplicateOptionItem[];
}

export interface DuplicateGroupItem {
  question_text_sample: string;
  dup_count: number;
  questions: DuplicateQuestionItem[];
}

export interface DuplicateQuestionsResponse {
  total_groups: number;
  page: number;
  page_size: number;
  groups: DuplicateGroupItem[];
}

export interface AssociatedTestItem {
  test_id: number;
  test_name: string;
  franchise_name: string;
  question_count: number;
}

export interface AssociatedStudentItem {
  user_id: number;
  student_name: string;
  enrollment_no: string | null;
  franchise_name: string;
  test_name: string;
  attempt_count: number;
  last_attempted_at: string;
}

export interface DeleteConflictResponse {
  requires_force: number;
  question_count?: number;
  lot_number?: number;
  test_count: number;
  attempt_count: number;
  bookmark_count: number;
  associated_tests?: AssociatedTestItem[];
  associated_students?: AssociatedStudentItem[];
}

export const getLotsSummary = async (payload?: { searchKeyword?: string }): Promise<LotSummaryItem[]> => {
  const response = await api.post(API_ROUTES.GET_QUESTION_LOTS_SUMMARY, payload || {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as LotSummaryItem[];
  }
  throw new Error(response.data?.message || "Failed to fetch lots summary");
};

export const deleteQuestionLot = async (payload: {
  lot_number: number;
  force_delete?: boolean;
  check_only?: boolean;
}): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.DELETE_QUESTION_LOT, payload);
  return response.data;
};

export const checkLotAssociations = async (lot_number: number): Promise<DeleteConflictResponse> => {
  const response = await api.post(API_ROUTES.DELETE_QUESTION_LOT, { lot_number, check_only: true });
  return (response.data?.data || {}) as DeleteConflictResponse;
};

export const getDuplicateQuestions = async (payload?: {
  category_id?: number;
  lot_number?: number;
  searchKeyword?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<DuplicateQuestionsResponse> => {
  const response = await api.post(API_ROUTES.GET_DUPLICATE_QUESTIONS, payload || {});
  if (response.data.isSuccess) {
    return (response.data?.data || { total_groups: 0, page: 1, page_size: 20, groups: [] }) as DuplicateQuestionsResponse;
  }
  throw new Error(response.data?.message || "Failed to fetch duplicate questions");
};

export const advancedDeleteQuestions = async (payload: {
  question_ids: number[];
  force_delete?: boolean;
  check_only?: boolean;
}): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.ADVANCED_DELETE_QUESTIONS, payload);
  return response.data;
};

export const checkQuestionsAssociations = async (question_ids: number[]): Promise<DeleteConflictResponse> => {
  const response = await api.post(API_ROUTES.ADVANCED_DELETE_QUESTIONS, { question_ids, check_only: true });
  return (response.data?.data || {}) as DeleteConflictResponse;
};

