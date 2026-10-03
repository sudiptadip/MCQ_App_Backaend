export interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    category_type: string;
    root_category_id?: number;
    
    children?: Category[];
}