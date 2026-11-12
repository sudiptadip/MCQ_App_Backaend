export interface ExamCategoryItem {
  id: number;
  title: string;
  description?: string;
  href: string;
  imageUrl?: string;
  iconName: string;
  accentColor?: string;
  displayOrder: number;
  isActive: boolean;
  createdOn?: string;
  modifiedOn?: string;
}

export interface ExamCategoryPage {
  items: ExamCategoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
