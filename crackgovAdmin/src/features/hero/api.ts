import api from "../../lib/axios";
import { API_ROUTES } from "../../constants/apiRoute";
import type { HeroSectionData } from "./types";

export async function getAdminHeroSection(): Promise<HeroSectionData> {
  const response = await api.post(API_ROUTES.GET_HERO_SECTION, {});
  if (!response.data.isSuccess || !response.data.data) {
    throw new Error(response.data.message || "Failed to load Hero section configuration");
  }
  return response.data.data as HeroSectionData;
}

export async function updateAdminHeroSection(payload: Partial<HeroSectionData>) {
  const response = await api.post(API_ROUTES.UPDATE_HERO_SECTION, payload);
  if (!response.data.isSuccess) {
    throw new Error(response.data.message || "Failed to update Hero section");
  }
  return response.data;
}
