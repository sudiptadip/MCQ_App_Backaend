import { API_URL } from "@/lib/api";
import type { TestimonialItem } from "@/types/testimonials";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.isSuccess) throw new Error(result.message || "Unable to load testimonials");
  return (result.data ?? []) as T;
}

export async function getPublicTestimonials(): Promise<TestimonialItem[]> {
  const response = await fetch(`${API_ROOT}/anonymous/SpAnonymousTestimonials/1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
    cache: "no-store",
  });
  return readResponse<TestimonialItem[]>(response);
}
