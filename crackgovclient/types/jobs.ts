export interface JobPost {
  id: number;
  title: string;
  department: string;
  categoryId: number;
  categoryName: string;
  employmentType: string;
  location: string;
  vacancies: number;
  salaryText: string | null;
  qualification: string;
  ageLimit: string | null;
  applicationStartDate: string | null;
  applicationDeadline: string | null;
  description: string;
  responsibilities: string | null;
  eligibility: string | null;
  applicationUrl: string | null;
  notificationUrl: string | null;
  referenceNumber: string | null;
  status: string;
  isFeatured: boolean;
  slug: string;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  createdOn: string;
}
