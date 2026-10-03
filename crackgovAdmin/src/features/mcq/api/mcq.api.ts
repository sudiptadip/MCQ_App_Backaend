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
  image_url?: string | null;
  image_document_id?: number | null;
  options: QuestionOption[];
}

export interface UpsertQuestionPayload {
  question: Partial<Question>;
  options: Partial<QuestionOption>[];
}

export const getQuestionAnsList = async (params?: { 
  pageNumber?: number; 
  pageSize?: number; 
  searchKeyword?: string; 
}): Promise<{ questions: QuestionWithDetails[]; totalCount: number }> => {
  const response = await api.post(API_ROUTES.GET_QUESTION_ANS_LIST, params || {});
  if (response.data.isSuccess) {
    const list = (response.data?.data || []) as QuestionWithDetails[];
    const totalCount = list.length > 0 ? (list[0]?.question?.total_count ?? list[0]?.total_count ?? 0) : 0;
    return { questions: list, totalCount };
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

export const bulkUpsertQuestionAns = async (payload: UpsertQuestionPayload[]): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.BULK_UPSERT_QUESTION_ANS, { questions: payload });
  return response.data;
};
