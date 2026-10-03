import type { JobPost } from "@/types/jobs";
import { API_URL } from "@/lib/api";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

export interface PublicJobPage {
  items: JobPost[];
  totalCount: number;
  page: number;
  pageSize: number;
  categories: { id: number; name: string }[];
}

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.isSuccess) throw new Error(result.message || "Unable to load jobs");
  return result.data as T;
}

export async function getPublicJobs(params: { page?: number; pageSize?: number; categoryId?: number; search?: string } = {}): Promise<PublicJobPage> {
  const response = await fetch(`${API_ROOT}/anonymous/Jobs.SpAnonymousJobs/1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  return readResponse<PublicJobPage>(response);
}

export async function getPublicJobCategories(): Promise<{ id: number; name: string }[]> {
  const response = await fetch(`${API_ROOT}/anonymous/Jobs.SpAnonymousJobs/4`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    cache: "no-store",
  });
  return readResponse<{ id: number; name: string }[]>(response);
}

export async function getPublicJob(slug: string | number): Promise<JobPost> {
  try {
    const response = await fetch(`${API_ROOT}/anonymous/Jobs.SpAnonymousJobs/6`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(typeof slug === "number" ? { id: slug } : { slug }),
      cache: "no-store",
    });
    const result = await response.json();
    if (response.ok && result.isSuccess && result.data) return result.data as JobPost;
  } catch {
    // Older deployed public procedures may not yet support detail lookups by slug.
  }

  let page = 1;
  let pageCount = 1;
  while (page <= pageCount) {
    const results = await getPublicJobs({ page, pageSize: 100 });
    const job = results.items.find((item) =>
      typeof slug === "number" ? item.id === slug : item.slug.toLowerCase() === slug.toLowerCase(),
    );
    if (job) return job;
    pageCount = Math.ceil(results.totalCount / 100);
    page += 1;
  }

  throw new Error("Job post not found");
}
