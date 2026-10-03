export type BlogStatus = "Draft" | "Published" | "Archived";
export type BlogTemplate = "editorial" | "guide" | "announcement";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string | null;
  excerpt: string | null;
  imageUrl: string | null;
  htmlContent: string;
  templateKey: BlogTemplate;
  authorName: string | null;
  status: BlogStatus;
  isFeatured: boolean;
  pageTitle: string;
  metaTitle: string;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  publishedOn: string | null;
  createdOn: string;
}

export interface BlogPage {
  items: BlogPost[];
  totalCount: number;
  page: number;
  pageSize: number;
}
