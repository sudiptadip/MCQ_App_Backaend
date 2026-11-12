import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { ExamCategoryItem, ExamCategoryPage } from "./types";

export async function getExamCategories(params: { page: number; pageSize: number; search?: string }): Promise<ExamCategoryPage> {
  const response = await api.post(API_ROUTES.GET_EXAM_CATEGORIES, params);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load Exam Categories");
  return response.data.data as ExamCategoryPage;
}

export async function getExamCategoryById(id: number): Promise<ExamCategoryItem> {
  const response = await api.post(API_ROUTES.GET_EXAM_CATEGORY_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) throw new Error(response.data.message || "Exam Category not found");
  return response.data.data as ExamCategoryItem;
}

export async function saveExamCategory(payload: Partial<ExamCategoryItem>) {
  const response = await api.post(API_ROUTES.UPSERT_EXAM_CATEGORY, payload);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to save Exam Category");
  return response.data;
}

export async function deleteExamCategory(id: number) {
  const response = await api.post(API_ROUTES.DELETE_EXAM_CATEGORY, { id });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to delete Exam Category");
  return response.data;
}

export async function toggleExamCategoryStatus(id: number, isActive: boolean) {
  const response = await api.post(API_ROUTES.TOGGLE_EXAM_CATEGORY_STATUS, { id, isActive });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to update status");
  return response.data;
}
