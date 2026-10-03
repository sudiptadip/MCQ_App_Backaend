import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type DisplayView from "../../../types/database/DisplayView";
import type apiResponse from "../../../types/apiResponse";

export interface DisplayViewStudent {
  student_user_id: number;
  name: string;
  email: string;
  is_student: boolean;
}

export const getDisplayViews = async (): Promise<DisplayView[]> => {
  const response = await api.post(API_ROUTES.GET_DISPLAY_VIEW_LIST, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as DisplayView[];
  }
  throw new Error(response.data.message || "Failed to fetch display views");
};

export const getDisplayViewTree = async (rootId: number): Promise<DisplayView[]> => {
  const response = await api.post(API_ROUTES.GET_DISPLAY_VIEW_CHILDREN, { id: rootId });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as DisplayView[];
  }
  throw new Error(response.data.message || "Failed to fetch display view tree");
};

export const upsertDisplayView = async (
  payload: Partial<DisplayView>
): Promise<apiResponse<DisplayView>> => {
  const response = await api.post(API_ROUTES.UPSERT_DISPLAY_VIEW, payload);
  return response.data;
};

export const deleteDisplayView = async (id: number): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.DELETE_DISPLAY_VIEW, { id });
  return response.data;
};

export const getDisplayViewStudentList = async (
  displayViewId: number
): Promise<DisplayViewStudent[]> => {
  const response = await api.post(API_ROUTES.GET_DISPLAY_VIEW_STUDENT_LIST, {
    display_view_id: displayViewId,
  });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as DisplayViewStudent[];
  }
  throw new Error(response.data.message || "Failed to fetch student list");
};

export const assignDisplayView = async (payload: {
  display_view_id: number;
  student_user_id: number;
}): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.ASSIGN_DISPLAY_VIEW, payload);
  return response.data;
};

export const getDisplayViewsForStudent = async (): Promise<DisplayView[]> => {
  const response = await api.post(API_ROUTES.GET_DISPLAY_VIEW_LIST_FOR_STUDENT, {});
  if (response.data.isSuccess) {
    return (response.data?.data || []) as DisplayView[];
  }
  throw new Error(response.data.message || "Failed to fetch display views for student");
};
