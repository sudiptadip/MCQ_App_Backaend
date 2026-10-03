import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type { AdminDashboardData, StudentDashboardData } from "../types";

export const getAdminDashboardStats = async (): Promise<AdminDashboardData> => {
  try {
    const response = await api.post(API_ROUTES.GET_ADMIN_DASHBOARD_STATS, {});
    if (response.data?.isSuccess && response.data?.data) {
      const rawData = response.data.data;
      let activities = [];
      if (typeof rawData.recent_activities === 'string') {
        try { activities = JSON.parse(rawData.recent_activities); } catch (e) { activities = []; }
      } else if (Array.isArray(rawData.recent_activities)) {
        activities = rawData.recent_activities;
      }

      return {
        total_students: Number(rawData.total_students || 0),
        total_questions: Number(rawData.total_questions || 0),
        active_tests: Number(rawData.active_tests || 0),
        total_attempts: Number(rawData.total_attempts || 0),
        avg_completion_rate: Number(rawData.avg_completion_rate || 0),
        total_study_materials: Number(rawData.total_study_materials || 0),
        recent_activities: activities,
      };
    }
  } catch (error) {
    console.warn("Could not fetch admin dashboard stats, using initial structure", error);
  }

  return {
    total_students: 0,
    total_questions: 0,
    active_tests: 0,
    total_attempts: 0,
    avg_completion_rate: 0,
    total_study_materials: 0,
    recent_activities: [],
  };
};

export const getStudentDashboardStats = async (): Promise<StudentDashboardData> => {
  try {
    const response = await api.post(API_ROUTES.GET_STUDENT_DASHBOARD_STATS, {});
    if (response.data?.isSuccess && response.data?.data) {
      const rawData = response.data.data;
      let attempts = [];
      if (typeof rawData.recent_attempts === 'string') {
        try { attempts = JSON.parse(rawData.recent_attempts); } catch (e) { attempts = []; }
      } else if (Array.isArray(rawData.recent_attempts)) {
        attempts = rawData.recent_attempts;
      }

      return {
        total_attempts: Number(rawData.total_attempts || 0),
        success_rate: Number(rawData.success_rate || 0),
        accuracy_percentage: Number(rawData.accuracy_percentage || 0),
        practice_time_minutes: Number(rawData.practice_time_minutes || 0),
        recent_attempts: attempts,
      };
    }
  } catch (error) {
    console.warn("Could not fetch student dashboard stats, using initial structure", error);
  }

  return {
    total_attempts: 0,
    success_rate: 0,
    accuracy_percentage: 0,
    practice_time_minutes: 0,
    recent_attempts: [],
  };
};
