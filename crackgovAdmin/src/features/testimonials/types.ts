export interface TestimonialItem {
  id: number;
  studentName: string;
  examName?: string;
  rankOrScore?: string;
  avatarUrl?: string;
  content: string;
  rating: number;
  displayOrder: number;
  isActive: boolean;
  createdOn?: string;
  modifiedOn?: string;
}

export interface TestimonialPage {
  items: TestimonialItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
