import { API_URL } from "@/lib/api";
import type { HeroSectionItem } from "@/types/hero";

const API_ROOT = `${API_URL.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`;

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.isSuccess) throw new Error(result.message || "Unable to load Hero Section");
  return result.data as T;
}

export async function getPublicHeroSection(): Promise<HeroSectionItem | null> {
  try {
    const response = await fetch(`${API_ROOT}/anonymous/SpAnonymousHeroSection/1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
    });
    return await readResponse<HeroSectionItem>(response);
  } catch {
    return null;
  }
}
