import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type { LeaderboardEntry, LeaderboardFilters } from "../types";

export const getLeaderboard = async (filters: LeaderboardFilters): Promise<LeaderboardEntry[]> => {
  const response = await api.post(API_ROUTES.GET_LEADERBOARD, filters);
  if (response.data.isSuccess) {
    return (response.data.data as LeaderboardEntry[]) || [];
  }
  throw new Error(response.data.message || "Failed to fetch leaderboard data");
};
