import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { BlogPage, BlogPost, BlogStatus } from "./types";

export async function getBlogs(params: { page: number; pageSize: number; search?: string }): Promise<BlogPage> {
  const response = await api.post(API_ROUTES.GET_BLOGS, params);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to load blog posts");
  return response.data.data as BlogPage;
}

export async function getBlogById(id: number): Promise<BlogPost> {
  const response = await api.post(API_ROUTES.GET_BLOG_BY_ID, { id });
  if (!response.data.isSuccess || !response.data.data) throw new Error(response.data.message || "Blog post not found");
  return response.data.data as BlogPost;
}

export async function saveBlog(payload: Partial<BlogPost>) {
  const response = await api.post(API_ROUTES.UPSERT_BLOG, payload);
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to save blog post");
  return response.data;
}

export async function setBlogStatus(id: number, status: BlogStatus) {
  const response = await api.post(API_ROUTES.SET_BLOG_STATUS, { id, status });
  if (!response.data.isSuccess) throw new Error(response.data.message || "Failed to update blog post");
  return response.data;
}
