import { API_URL } from "@/lib/api";
import type { FaqItem } from "@/types/faqs";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.isSuccess) throw new Error(result.message || "Unable to load FAQs");
  return (result.data ?? []) as T;
}

export async function getPublicFaqs(category?: string): Promise<FaqItem[]> {
  const response = await fetch(`${API_ROOT}/anonymous/SpAnonymousFaqs/1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category }),
    cache: "no-store",
  });
  return readResponse<FaqItem[]>(response);
}
