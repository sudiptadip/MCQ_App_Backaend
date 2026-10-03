import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { DailyCurrentAffair, DailyCurrentAffairsPage, DailyAffairStatus } from "./types";

export async function getDailyCurrentAffairs(params: { page: number; pageSize: number; search?: string }): Promise<DailyCurrentAffairsPage> {
  const response = await api.post(API_ROUTES.GET_DAILY_CURRENT_AFFAIRS, params);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load current affairs");
  return response.data.data as DailyCurrentAffairsPage;
}

export async function getDailyCurrentAffairById(id: number): Promise<DailyCurrentAffair> {
  const response = await api.post(API_ROUTES.GET_DAILY_CURRENT_AFFAIRS_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) throw new Error(response.data.message || "Current affairs item not found");
  return response.data.data as DailyCurrentAffair;
}

export async function saveDailyCurrentAffair(payload: Partial<DailyCurrentAffair>) {
  const response = await api.post(API_ROUTES.UPSERT_DAILY_CURRENT_AFFAIRS, payload);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to save current affairs item");
  return response.data;
}

export async function setDailyCurrentAffairStatus(id: number, status: DailyAffairStatus) {
  const response = await api.post(API_ROUTES.SET_DAILY_CURRENT_AFFAIRS_STATUS, { id, status });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to update status");
  return response.data;
}
