import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { ContactPage, ContactSubmission } from "./types";

export async function getContactSubmissions(params: { page: number; pageSize: number; search?: string }): Promise<ContactPage> {
  const response = await api.post(API_ROUTES.GET_CONTACT_SUBMISSIONS, params);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load contact submissions");
  return response.data.data as ContactPage;
}

export async function getContactSubmissionById(id: number): Promise<ContactSubmission> {
  const response = await api.post(API_ROUTES.GET_CONTACT_SUBMISSION_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) throw new Error(response.data.message || "Contact submission not found");
  return response.data.data as ContactSubmission;
}

export async function deleteContactSubmission(id: number) {
  const response = await api.post(API_ROUTES.DELETE_CONTACT_SUBMISSION, { id });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to delete contact submission");
  return response.data;
}

export async function toggleContactReadStatus(id: number, isRead: boolean) {
  const response = await api.post(API_ROUTES.TOGGLE_CONTACT_READ_STATUS, { id, isRead });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to update read status");
  return response.data;
}
