import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type apiResponse from "../../../types/apiResponse";
import type Tests from "../../../types/database/Tests";
import type Test_questions from "../../../types/database/Test_questions";
import type { QuestionWithDetails } from "../../mcq/api/mcq.api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TestWithQuestionIds {
  test: Tests;
  question_ids: number[] | string;
  questions?: QuestionWithDetails[];
}

export interface QuestionFilterParams {
  search?: string;
  category_id?: number;
  root_category_id?: number;
  difficulty_level?: string;
  order_by?: "latest" | "oldest" | "difficulty_asc" | "difficulty_desc";
  page?: number;
  page_size?: number;
}

export interface FilteredQuestionsResponse {
  data: QuestionWithDetails[];
  total: number;
}

// ─── Test CRUD ────────────────────────────────────────────────────────────────

export const getTestList = async (): Promise<Tests[]> => {
  const response = await api.post(API_ROUTES.GET_TEST_LIST, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as Tests[];
  }
  throw new Error(response.data.message || "Failed to fetch test list");
};

export interface UpsertTestPayload extends Partial<Tests> {
  question_ids: number[];
}

export const upsertTest = async (
  payload: UpsertTestPayload
): Promise<apiResponse<{ id: number }>> => {
  const response = await api.post(API_ROUTES.UPSERT_TEST, payload);
  return response.data;
};

export const deleteTest = async (
  id: number
): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.DELETE_TEST, { id });
  return response.data;
};

export const getTestById = async (
  id: number
): Promise<TestWithQuestionIds> => {
  const response = await api.post(API_ROUTES.GET_TEST_BY_ID, { id });
  if (response.data.isSuccess) {
    const data = response.data?.data as TestWithQuestionIds;
    // Backend may return question_ids as a JSON string — parse it if so
    if (typeof data?.question_ids === "string") {
      try { data.question_ids = JSON.parse(data.question_ids); }
      catch { data.question_ids = []; }
    }
    return data;
  }
  throw new Error(response.data.message || "Failed to fetch test");
};

// ─── Test Questions ───────────────────────────────────────────────────────────

export const upsertTestQuestions = async (payload: {
  test_id: number;
  question_ids: number[];
}): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.UPSERT_TEST_QUESTIONS, payload);
  return response.data;
};

export const getTestQuestions = async (
  test_id: number
): Promise<Test_questions[]> => {
  const response = await api.post(API_ROUTES.GET_TEST_QUESTIONS, { test_id });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as Test_questions[];
  }
  throw new Error(response.data.message || "Failed to fetch test questions");
};

// ─── Filtered Question Bank ───────────────────────────────────────────────────

export const getFilteredQuestions = async (
  filters: QuestionFilterParams
): Promise<FilteredQuestionsResponse> => {
  const response = await api.post(API_ROUTES.GET_FILTERED_QUESTIONS, filters);
  if (response.data.isSuccess) {
    const questions = (response.data?.data || []) as QuestionWithDetails[];
    const totalCount = questions[0]?.total_count ?? 
                       questions[0]?.question?.total_count ?? 
                       response.data?.total ?? 
                       questions.length;
    return {
      data: questions,
      total: totalCount,
    };
  }
  throw new Error(response.data.message || "Failed to fetch filtered questions");
};

// ─── Franchise Assignment ─────────────────────────────────────────────────────

export interface FranchiseDropDownItem {
  label: string;
  value: number;
  is_selected?: number | boolean;
}

export const getFranchiseDropDownList = async (): Promise<FranchiseDropDownItem[]> => {
  const response = await api.post(API_ROUTES.GET_FRANCHISE_DROP_DOWN, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as FranchiseDropDownItem[];
  }
  throw new Error(response.data.message || "Failed to fetch franchise list");
};

export const getFranchiseTestMappings = async (
  testId: number
): Promise<FranchiseDropDownItem[]> => {
  const response = await api.post(API_ROUTES.GET_FRANCHISE_TEST_MAPPINGS, { test_id: testId });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as FranchiseDropDownItem[];
  }
  throw new Error(response.data.message || "Failed to fetch franchise mappings");
};

export interface SaveFranchiseTestPayload {
  test_id: number;
  franchise_ids: number[];
}

export const saveFranchiseTest = async (
  payload: SaveFranchiseTestPayload
): Promise<apiResponse<number>> => {
  const response = await api.post(API_ROUTES.SAVE_FRANCHISE_TEST, payload);
  return response.data;
};
