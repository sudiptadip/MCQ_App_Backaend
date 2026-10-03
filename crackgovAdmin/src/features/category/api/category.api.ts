import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type { Category } from "../../../types/database/Category";
import type apiResponse from "../../../types/apiResponse";

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.post(API_ROUTES.GET_CATEGORY_LIST, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as Category[];
  }
  throw new Error(response.data.message || "Failed to fetch categories");
};

export const upsertCategory = async (payload: Partial<Category>): Promise<apiResponse<Category>> => {
  const response = await api.post(API_ROUTES.UPSERT_CATEGORY, payload);
  return response.data;
};


export const deleteCategory = async (id: number): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.DELETE_CATEGORY, { id: id });
  return response.data;
};

export const getParentCategories = async (): Promise<Category[]> => {
  const response = await api.post(API_ROUTES.GET_PARENT_CATEGORY_LIST, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as Category[];
  }
  throw new Error(response.data.message || "Failed to fetch parent categories");
};

export const getCategoriesByParentId = async (categoryId: number): Promise<Category[]> => {
  const response = await api.post(API_ROUTES.GET_CATEGORY_PARENT_CHILD_BY_ID, { id: categoryId });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as Category[];
  }
  throw new Error(response.data.message || "Failed to fetch child categories");
};

export const getAssignedFranchiseCategories = async (): Promise<Category[]> => {
  const response = await api.post(API_ROUTES.GET_ASSIGNED_FRANCHISE_CATEGORIES, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as Category[];
  }
  throw new Error(response.data.message || "Failed to fetch assigned franchise categories");
};

export const getCategoryTree = async (categoryId: number): Promise<Category[]> => {
  const response = await api.post(API_ROUTES.GET_CATEGORY_PARENT_CHILD_BY_ID, { id: categoryId });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as Category[];
  }
  throw new Error(response.data.message || "Failed to fetch category tree");
};

export interface CategoryWithCounts extends Category {
  direct_question_count: number;
  total_question_count: number;
}

export const getCategoriesWithQuestionCounts = async (): Promise<CategoryWithCounts[]> => {
  const response = await api.post(API_ROUTES.GET_CATEGORIES_WITH_QUESTION_COUNTS, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as CategoryWithCounts[];
  }
  throw new Error(response.data.message || "Failed to fetch category question counts");
};
