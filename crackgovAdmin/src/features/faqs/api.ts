import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { FaqItem, FaqPage } from "./types";

export async function getFaqs(params: { page: number; pageSize: number; search?: string; category?: string }): Promise<FaqPage> {
  const response = await api.post(API_ROUTES.GET_FAQS, params);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load FAQs");
  return response.data.data as FaqPage;
}

export async function getFaqById(id: number): Promise<FaqItem> {
  const response = await api.post(API_ROUTES.GET_FAQ_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) throw new Error(response.data.message || "FAQ item not found");
  return response.data.data as FaqItem;
}

export async function saveFaq(payload: Partial<FaqItem>) {
  const response = await api.post(API_ROUTES.UPSERT_FAQ, payload);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to save FAQ");
  return response.data;
}

export async function deleteFaq(id: number) {
  const response = await api.post(API_ROUTES.DELETE_FAQ, { id });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to delete FAQ");
  return response.data;
}

export async function toggleFaqStatus(id: number, isActive: boolean) {
  const response = await api.post(API_ROUTES.TOGGLE_FAQ_STATUS, { id, isActive });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to update FAQ status");
  return response.data;
}
