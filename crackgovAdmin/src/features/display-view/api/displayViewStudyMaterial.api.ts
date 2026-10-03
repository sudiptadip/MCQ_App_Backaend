import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type apiResponse from "../../../types/apiResponse";

export interface DisplayViewStudyMaterial {
  id?: number;
  display_view_id: number;
  studyMaterial_id: number;
  studyMaterial_name?: string;
  studyMaterial_type?: string;
}

export const assignDisplayViewStudyMaterial = async (
  payload: DisplayViewStudyMaterial
): Promise<apiResponse<DisplayViewStudyMaterial>> => {
  const response = await api.post(API_ROUTES.UPSERT_DISPLAY_VIEW_STUDY_MATERIAL, payload);
  return response.data;
};

export const deleteDisplayViewStudyMaterial = async (
  id: number
): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.DELETE_DISPLAY_VIEW_STUDY_MATERIAL, { id });
  return response.data;
};

export const getDisplayViewStudyMaterials = async (
  display_view_id: number
): Promise<DisplayViewStudyMaterial[]> => {
  const response = await api.post(API_ROUTES.GET_DISPLAY_VIEW_STUDY_MATERIAL, {
    display_view_id,
  });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as DisplayViewStudyMaterial[];
  }
  throw new Error(
    response.data.message || "Failed to fetch display view study materials"
  );
};
