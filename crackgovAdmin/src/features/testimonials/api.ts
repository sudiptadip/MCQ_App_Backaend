import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { TestimonialItem, TestimonialPage } from "./types";

export async function getTestimonials(params: { page: number; pageSize: number; search?: string }): Promise<TestimonialPage> {
  const response = await api.post(API_ROUTES.GET_TESTIMONIALS, params);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load testimonials");
  return response.data.data as TestimonialPage;
}

export async function getTestimonialById(id: number): Promise<TestimonialItem> {
  const response = await api.post(API_ROUTES.GET_TESTIMONIAL_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) throw new Error(response.data.message || "Testimonial not found");
  return response.data.data as TestimonialItem;
}

export async function saveTestimonial(payload: Partial<TestimonialItem>) {
  const response = await api.post(API_ROUTES.UPSERT_TESTIMONIAL, payload);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to save testimonial");
  return response.data;
}

export async function deleteTestimonial(id: number) {
  const response = await api.post(API_ROUTES.DELETE_TESTIMONIAL, { id });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to delete testimonial");
  return response.data;
}

export async function toggleTestimonialStatus(id: number, isActive: boolean) {
  const response = await api.post(API_ROUTES.TOGGLE_TESTIMONIAL_STATUS, { id, isActive });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to update testimonial status");
  return response.data;
}
