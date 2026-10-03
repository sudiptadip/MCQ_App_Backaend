import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";
import type { User as Student } from "../../../types/database/User";
import type RegisterStudentDto from "../types/RegisterStudentDto";
import type { UpdateStudentDetailsDto } from "../types/UpdateStudentDetailsDto";
import type apiResponse from "../../../types/apiResponse";

import type { Category } from "../../../types/database/Category";

export interface StudentCategory extends Category {
  is_assigned: boolean;
}

export const getStudents = async (): Promise<Student[]> => {
  const response = await api.post(API_ROUTES.GET_STUDENT_LIST, {});
  if (response.data.isSuccess) {
    return (response.data.data as Student[]) || [];
  }
  throw new Error(response.data.message || "Failed to fetch students");
};

export const registerStudent = async (payload: RegisterStudentDto): Promise<apiResponse<string>> => {
  const response = await api.post(API_ROUTES.REGISTER_STUDENT, payload);
  return response.data;
};

export const getStudentDetailsByUserId = async (userId: number): Promise<Student | null> => {
  const response = await api.post(API_ROUTES.GET_STUDENT_DETAILS, { user_id: userId });
  if (response.data.isSuccess) {
    // Returning first item if it's an array, or just data if object
    const data = response.data.data;
    if (Array.isArray(data)) return data[0] as Student;
    return data as Student;
  }
  return null;
};

export const updateStudentDetails = async (payload: UpdateStudentDetailsDto): Promise<apiResponse<Student>> => {
  const response = await api.post(API_ROUTES.UPSERT_STUDENT_DETAILS, payload);
  return response.data;
};

export const resetUserDevice = async (userId: number): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.RESET_USER_DEVICE, {
    user_id: userId
  });
  return response.data;
};

export const getStudentCategories = async (studentUserId: number): Promise<StudentCategory[]> => {
  const response = await api.post(API_ROUTES.GET_STUDENT_CATEGORIES, {
    student_user_id: studentUserId
  });
  if (response.data.isSuccess) {
    return (response.data.data as StudentCategory[]) || [];
  }
  throw new Error(response.data.message || "Failed to fetch student categories");
};

export const toggleStudentCategory = async (payload: {
  student_user_id: number;
  category_id: number;
}): Promise<apiResponse<any>> => {
  const response = await api.post(API_ROUTES.TOGGLE_STUDENT_CATEGORY, payload);
  return response.data;
};

export interface StudentCompleteDetailsData {
  student_profile: {
    id: number;
    name: string;
    email: string;
    created_at?: string;
    franchise_id?: number;
    franchise_name?: string;
    father_name?: string;
    phone?: string;
    address?: string;
    is_device_locked?: boolean;
  };
  assigned_categories: Array<{
    id: number;
    name: string;
    category_type?: string;
    assigned_at?: string;
  }>;
  assigned_display_views: Array<{
    id: number;
    display_name: string;
    parent_id?: number;
    franchise_id: number;
  }>;
  practice_tests: Array<{
    attempt_id: number;
    test_id: number;
    test_name: string;
    total_questions: number;
    score: number;
    started_at?: string;
    completed_at?: string;
    accuracy?: number;
  }>;
  fee_summary: {
    total_assigned_net: number;
    total_paid: number;
    total_due: number;
    account_status: string;
  };
  fee_schedule: any[];
  payment_history: any[];
}

export const getStudentCompleteDetails = async (userId: number): Promise<StudentCompleteDetailsData | null> => {
  try {
    const response = await api.post(API_ROUTES.GET_STUDENT_COMPLETE_DETAILS, { student_user_id: userId });
    if (response.data?.isSuccess && response.data?.data) {
      const raw = response.data.data;
      let categories = [];
      let displayViews = [];
      let tests = [];
      let schedule = [];
      let payments = [];

      if (typeof raw.assigned_categories === 'string') {
        try { categories = JSON.parse(raw.assigned_categories); } catch (e) { categories = []; }
      } else if (Array.isArray(raw.assigned_categories)) {
        categories = raw.assigned_categories;
      }

      if (typeof raw.assigned_display_views === 'string') {
        try { displayViews = JSON.parse(raw.assigned_display_views); } catch (e) { displayViews = []; }
      } else if (Array.isArray(raw.assigned_display_views)) {
        displayViews = raw.assigned_display_views;
      }

      if (typeof raw.practice_tests === 'string') {
        try { tests = JSON.parse(raw.practice_tests); } catch (e) { tests = []; }
      } else if (Array.isArray(raw.practice_tests)) {
        tests = raw.practice_tests;
      }

      if (typeof raw.fee_schedule === 'string') {
        try { schedule = JSON.parse(raw.fee_schedule); } catch (e) { schedule = []; }
      } else if (Array.isArray(raw.fee_schedule)) {
        schedule = raw.fee_schedule;
      }

      if (typeof raw.payment_history === 'string') {
        try { payments = JSON.parse(raw.payment_history); } catch (e) { payments = []; }
      } else if (Array.isArray(raw.payment_history)) {
        payments = raw.payment_history;
      }

      let profileObj = raw.student_profile;
      if (typeof profileObj === 'string') {
        try { profileObj = JSON.parse(profileObj); } catch (e) {}
      }

      return {
        student_profile: profileObj || null,
        assigned_categories: categories,
        assigned_display_views: displayViews,
        practice_tests: tests,
        fee_summary: raw.fee_summary || { total_assigned_net: 0, total_paid: 0, total_due: 0, account_status: 'PENDING' },
        fee_schedule: schedule,
        payment_history: payments,
      };
    }
  } catch (error) {
    console.warn("Could not fetch complete student details", error);
  }
  return null;
};


