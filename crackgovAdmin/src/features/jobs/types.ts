export type JobStatus = "Draft" | "Published" | "Closed";

export interface JobCategory {
  id: number;
  name: string;
}

export interface JobPost {
  id: number;
  title: string;
  department: string;
  categoryId: number;
  categoryName?: string;
  employmentType: string;
  location: string;
  vacancies: number;
  salaryText: string;
  qualification: string;
  ageLimit: string;
  applicationStartDate: string | null;
  applicationDeadline: string | null;
  description: string;
  responsibilities: string;
  eligibility: string;
  applicationUrl: string;
  notificationUrl: string;
  referenceNumber: string;
  status: JobStatus;
  isFeatured: boolean;
  slug: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  createdOn: string;
}

export interface JobPage {
  items: JobPost[];
  totalCount: number;
  page: number;
  pageSize: number;
}
