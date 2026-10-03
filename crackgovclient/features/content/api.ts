import { fetchApi } from "@/lib/api";
import { StudentContentRoot, StudentContentNode } from "@/types/content";

export const getStudentContentRoots = async (material_group: 'notes' | 'videos'): Promise<StudentContentRoot[]> => {
  const response = await fetchApi('/execute-sp/auth-all/SpStudentStudyMaterial/1', {
    method: 'POST',
    body: JSON.stringify({ material_group })
  });
  if (response.isSuccess) {
    return (response.data || []) as StudentContentRoot[];
  }
  throw new Error(response.message || "Failed to fetch content roots");
};

export const getStudentContentTree = async (
  display_view_id: number,
  material_group: 'notes' | 'videos'
): Promise<StudentContentNode[]> => {
  const response = await fetchApi('/execute-sp/auth-all/SpStudentStudyMaterial/2', {
    method: 'POST',
    body: JSON.stringify({ display_view_id, material_group })
  });
  if (response.isSuccess) {
    return (response.data || []) as StudentContentNode[];
  }
  throw new Error(response.message || "Failed to fetch content tree");
};
