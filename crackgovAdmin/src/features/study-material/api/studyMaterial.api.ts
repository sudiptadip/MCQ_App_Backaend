import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type { StudyMaterial } from "../../../types/database/StudyMaterial";
import type apiResponse from "../../../types/apiResponse";

export const getStudyMaterialList = async (): Promise<StudyMaterial[]> => {
  const response = await api.post(API_ROUTES.GET_STUDY_MATERIAL_LIST, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as StudyMaterial[];
  }
  throw new Error(response.data.message || "Failed to fetch study materials");
};

export const upsertStudyMaterial = async (payload: Partial<StudyMaterial>): Promise<apiResponse<StudyMaterial>> => {
  const response = await api.post(API_ROUTES.UPSERT_STUDY_MATERIAL, payload);
  return response.data;
};

export const deleteStudyMaterial = async (id: number): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.DELETE_STUDY_MATERIAL, { id: id });
  return response.data;
};
