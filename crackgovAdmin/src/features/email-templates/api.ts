import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { EmailTemplateItem, EmailTemplatePage, RenderEmailTemplateResponse } from "./types";

export async function getEmailTemplates(params: {
  page: number;
  pageSize: number;
  search?: string;
  franchiseId?: number;
}): Promise<EmailTemplatePage> {
  const response = await api.post(API_ROUTES.GET_EMAIL_TEMPLATES, params);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || "Failed to load email templates");
  }
  return response.data.data as EmailTemplatePage;
}

export async function getEmailTemplateById(id: number): Promise<EmailTemplateItem> {
  const response = await api.post(API_ROUTES.GET_EMAIL_TEMPLATE_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) {
    throw new Error(response.data.message || "Email template not found");
  }
  return response.data.data as EmailTemplateItem;
}

export async function saveEmailTemplate(payload: Partial<EmailTemplateItem>) {
  const response = await api.post(API_ROUTES.UPSERT_EMAIL_TEMPLATE, payload);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || "Failed to save email template");
  }
  return response.data;
}

export async function deleteEmailTemplate(id: number) {
  const response = await api.post(API_ROUTES.DELETE_EMAIL_TEMPLATE, { id });
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || "Failed to delete email template");
  }
  return response.data;
}

export async function toggleEmailTemplateStatus(id: number, isActive: boolean) {
  const response = await api.post(API_ROUTES.TOGGLE_EMAIL_TEMPLATE_STATUS, { id, isActive });
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || "Failed to update email template status");
  }
  return response.data;
}

export async function renderEmailTemplate(payload: {
  templateKey: string;
  franchiseId?: number;
  replaceValues: Record<string, string>;
}): Promise<RenderEmailTemplateResponse> {
  const response = await api.post(API_ROUTES.RENDER_EMAIL_TEMPLATE, payload);
  if (!response.data.isSuccess || !response.data.data) {
    throw new Error(response.data.message || "Failed to render email template");
  }
  return response.data.data as RenderEmailTemplateResponse;
}
