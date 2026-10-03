import { API_URL } from "@/lib/api";
import type { DailyCurrentAffair, DailyCurrentAffairsPageData } from "@/types/current-affairs";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.isSuccess) throw new Error(result.message || "Unable to load current affairs");
  return result.data as T;
}

export async function getPublicCurrentAffairs(params: { page?: number; pageSize?: number; search?: string; category?: string; fromDate?: string; toDate?: string } = {}): Promise<DailyCurrentAffairsPageData> {
  const response = await fetch(`${API_ROOT}/anonymous/CurrentAffairs.SpAnonymousDailyCurrentAffairs/1`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params), cache: "no-store" });
  return readResponse<DailyCurrentAffairsPageData>(response);
}

export async function getPublicCurrentAffair(slug: string): Promise<DailyCurrentAffair> {
  const response = await fetch(`${API_ROOT}/anonymous/CurrentAffairs.SpAnonymousDailyCurrentAffairs/2`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), cache: "no-store" });
  return readResponse<DailyCurrentAffair>(response);
}
