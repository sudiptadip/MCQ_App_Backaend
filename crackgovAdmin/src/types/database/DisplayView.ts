export default interface DisplayView {
  id: number;
  display_name: string;
  franchise_id?: number;
  parent_id?: number | null; 
  assigned_tests?: string | { id: number; test_id: number; test_name: string }[];
  assigned_study_materials?: string | { id: number; studyMaterial_id: number; studyMaterial_name: string; type: string }[];
}