export interface StudyMaterial {
    id: number;
    name: string;
    description: string;
    type: string;
    url: string;
    category_id?: number | null;
    category_name?: string | null;
}
