import api from "../../../lib/axios";
import { API_ROUTES } from "../../../constants/apiRoute";

export interface StudentContentRoot {
  id: number;
  display_name: string;
}

export interface StudentContentNode {
  id: number;
  display_name: string;
  parent_id: number | null;
  franchise_id: number;
  assigned_study_materials?: string | any[];
}

export const getStudentContentRoots = async (material_group: 'notes' | 'videos'): Promise<StudentContentRoot[]> => {
  const response = await api.post(API_ROUTES.GET_STUDENT_CONTENT_ROOTS, { material_group });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as StudentContentRoot[];
  }
  throw new Error(response.data.message || "Failed to fetch content roots");
};

export interface StudyMaterial {
  studyMaterial_id: number;
  name: string;
  type: string;
  url: string;
  description: string;
  folder_name?: string;
}

export const getStudentContentTree = async (
  display_view_id: number,
  material_group: 'notes' | 'videos'
): Promise<StudentContentNode[]> => {
  const response = await api.post(API_ROUTES.GET_STUDENT_CONTENT_TREE, { display_view_id, material_group });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as StudentContentNode[];
  }
  throw new Error(response.data.message || "Failed to fetch content tree");
};

export const getStudentContentFlatList = async (material_group: 'notes' | 'videos'): Promise<StudyMaterial[]> => {
  const response = await api.post(API_ROUTES.GET_STUDENT_CONTENT_FLAT, { material_group });
  if (response.data.isSuccess) {
    return (response.data?.data || []) as StudyMaterial[];
  }
  throw new Error(response.data.message || "Failed to fetch flat content");
};
