export type CurrentAffairsTemplate = "daily-brief" | "topic-explainer" | "quick-revision";

export interface DailyCurrentAffair {
  id: number;
  affairDate: string;
  title: string;
  slug: string;
  category: string | null;
  examRelevance: "High" | "Medium" | "Low";
  excerpt: string | null;
  imageUrl: string | null;
  htmlContent?: string;
  templateKey: CurrentAffairsTemplate;
  sourceName: string | null;
  sourceUrl: string | null;
  isFeatured: boolean;
  pageTitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  publishedOn: string | null;
  createdOn: string;
}

export interface DailyCurrentAffairsPageData {
  items: DailyCurrentAffair[];
  totalCount: number;
  page: number;
  pageSize: number;
  categories: { name: string }[];
}
