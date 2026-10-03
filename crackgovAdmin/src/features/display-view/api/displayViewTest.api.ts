import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type apiResponse from "../../../types/apiResponse";
import type DisplayViewTest from "../../../types/database/Display_view_test";

/** Assign a test to a display view node */
export const assignDisplayViewTest = async (
  payload: DisplayViewTest
): Promise<apiResponse<DisplayViewTest>> => {
  const response = await api.post(API_ROUTES.UPSERT_DISPLAY_VIEW_TEST, payload);
  return response.data;
};

/** Remove a test assignment */
export const deleteDisplayViewTest = async (
  id: number
): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.DELETE_DISPLAY_VIEW_TEST, { id });
  return response.data;
};

/** Get all tests assigned to a specific display view node */
export const getDisplayViewTests = async (
  display_view_id: number
): Promise<DisplayViewTest[]> => {
  const response = await api.post(API_ROUTES.GET_DISPLAY_VIEW_TESTS, {
    display_view_id,
  });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as DisplayViewTest[];
  }
  throw new Error(
    response.data.message || "Failed to fetch display view tests"
  );
};
