import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { JobCategory, JobPage, JobPost } from "./types";

export async function getJobs(params: { page: number; pageSize: number; search?: string }): Promise<JobPage> {
  const response = await api.post(API_ROUTES.GET_JOBS, params);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load jobs");
  return response.data.data as JobPage;
}

export async function getJobById(id: number): Promise<JobPost> {
  const response = await api.post(API_ROUTES.GET_JOB_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) throw new Error(response.data.message || "Job post not found");
  return response.data.data as JobPost;
}

export async function getJobCategories(): Promise<JobCategory[]> {
  const response = await api.post(API_ROUTES.GET_JOB_CATEGORIES, {});
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load job categories");
  return (response.data.data || []) as JobCategory[];
}

export async function saveJob(payload: Partial<JobPost>) {
  const response = await api.post(API_ROUTES.UPSERT_JOB, payload);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to save job");
  return response.data;
}

export async function closeJob(id: number) {
  const response = await api.post(API_ROUTES.CLOSE_JOB, { id });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to close job");
  return response.data;
}

export async function createJobCategory(name: string): Promise<JobCategory> {
  const response = await api.post(API_ROUTES.CREATE_JOB_CATEGORY, { name });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to create category");
  return response.data.data as JobCategory;
}
