export type DailyAffairStatus = "Draft" | "Published" | "Archived";
export type ExamRelevance = "High" | "Medium" | "Low";
export type CurrentAffairsTemplate = "daily-brief" | "topic-explainer" | "quick-revision";

export interface DailyCurrentAffair {
  id: number;
  affairDate: string;
  title: string;
  slug: string;
  category: string | null;
  examRelevance: ExamRelevance;
  excerpt: string | null;
  imageUrl: string | null;
  htmlContent: string;
  templateKey: CurrentAffairsTemplate;
  sourceName: string | null;
  sourceUrl: string | null;
  status: DailyAffairStatus;
  isFeatured: boolean;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  publishedOn: string | null;
  createdOn: string;
}

export interface DailyCurrentAffairsPage {
  items: DailyCurrentAffair[];
  totalCount: number;
  page: number;
  pageSize: number;
}
