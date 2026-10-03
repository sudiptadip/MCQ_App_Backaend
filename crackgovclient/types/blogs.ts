export type BlogTemplate = "editorial" | "guide" | "announcement";

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string | null;
  excerpt: string | null;
  imageUrl: string | null;
  htmlContent?: string;
  templateKey: BlogTemplate;
  authorName: string | null;
  isFeatured: boolean;
  pageTitle: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  publishedOn: string | null;
  createdOn: string;
}

export interface BlogPageData {
  items: BlogPost[];
  totalCount: number;
  page: number;
  pageSize: number;
  categories: { name: string }[];
}
