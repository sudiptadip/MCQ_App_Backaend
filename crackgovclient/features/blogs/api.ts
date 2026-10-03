import { API_URL } from "@/lib/api";
import type { BlogPageData, BlogPost } from "@/types/blogs";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.isSuccess) throw new Error(result.message || "Unable to load blog posts");
  return result.data as T;
}

export async function getPublicBlogs(params: { page?: number; pageSize?: number; search?: string; category?: string } = {}): Promise<BlogPageData> {
  const response = await fetch(`${API_ROOT}/anonymous/Blogs.SpAnonymousBlogs/1`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params), cache: "no-store" });
  return readResponse<BlogPageData>(response);
}

export async function getPublicBlog(slug: string): Promise<BlogPost> {
  const response = await fetch(`${API_ROOT}/anonymous/Blogs.SpAnonymousBlogs/2`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), cache: "no-store" });
  return readResponse<BlogPost>(response);
}
