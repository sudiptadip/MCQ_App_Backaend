export interface StudentContentRoot {
  id: number;
  display_name: string;
}

export interface StudyMaterial {
  studyMaterial_id: number;
  name: string;
  type: string;
  url: string;
  description: string;
  folder_name?: string;
}

export interface StudentContentNode {
  id: number;
  display_name: string;
  parent_id: number | null;
  franchise_id: number;
  assigned_study_materials?: string | any[];
}
