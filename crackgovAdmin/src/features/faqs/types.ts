export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  createdOn?: string;
  modifiedOn?: string;
}

export interface FaqPage {
  items: FaqItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
