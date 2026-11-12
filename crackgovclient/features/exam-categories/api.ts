import { API_URL } from "@/lib/api";
import type { PublicExamCategoryItem } from "@/types/exam-categories";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.isSuccess) throw new Error(result.message || "Unable to load Exam Categories");
  return (result.data ?? []) as T;
}

export async function getPublicExamCategories(): Promise<PublicExamCategoryItem[]> {
  try {
    const response = await fetch(`${API_ROOT}/anonymous/SpAnonymousExamCategories/1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    return await readResponse<PublicExamCategoryItem[]>(response);
  } catch {
    return [];
  }
}
