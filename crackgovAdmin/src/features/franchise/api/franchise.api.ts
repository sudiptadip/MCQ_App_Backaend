import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type Franchise from "../../../types/database/Franchise";
import type apiResponse from "../../../types/apiResponse";
import type { UpsertFranchiseDto } from "../types/UpsertFranchiseDto";
import type { Category } from "../../../types/database/Category";

export interface FranchiseCategory extends Category {
  is_assigned: boolean;
}

export const getFranchises = async (): Promise<Franchise[]> => {
  const response = await api.post(API_ROUTES.GET_FRANCHISE_LIST, {});
  if (response.data.isSuccess) {
    return response.data.data as Franchise[];
  }
  throw new Error(response.data.message || "Failed to fetch franchises");
};

export const getFranchiseById = async (id: number): Promise<Franchise | null> => {
  const franchises = await getFranchises();
  const found = franchises.find(f => f.id === id);
  return found || null;
};

export const upsertFranchise = async (payload: UpsertFranchiseDto): Promise<apiResponse<Franchise>> => {
  const response = await api.post(API_ROUTES.UPSERT_FRANCHISE_LIST, payload);
  return response.data;
};

export const registerFranchise = async (payload: UpsertFranchiseDto): Promise<apiResponse<string>> => {
  const apiCreateFranchiseRes = await api.post(API_ROUTES.REGISTER, {
    name: payload.owner_name,
    email: payload.contact_email,
    password: payload.password,
    franchiseId: payload.id
  });
  return apiCreateFranchiseRes.data;
};

export const getFranchiseCategories = async (franchiseId: number): Promise<FranchiseCategory[]> => {
  const response = await api.post(API_ROUTES.GET_FRANCHISE_CATEGORIES, {
    franchise_id: franchiseId
  });
  if (response.data.isSuccess) {
    return (response.data.data as FranchiseCategory[]) || [];
  }
  throw new Error(response.data.message || "Failed to fetch franchise categories");
};

export const toggleFranchiseCategory = async (payload: {
  franchise_id: number;
  category_id: number;
}): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.TOGGLE_FRANCHISE_CATEGORY, payload);
  return response.data;
};