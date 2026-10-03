import type { Metadata } from "next";
import { BlogsDirectory } from "@/components/blogs/BlogsDirectory";
import { getPublicBlogs } from "@/features/blogs/api";

export const metadata: Metadata = {
  title: "Exam Preparation Guides & Education Updates",
  description: "Read practical government exam guides, application explainers and education updates from CrackGov.",
  keywords: ["government exam preparation", "exam guides", "recruitment updates", "application guide", "CrackGov blog"],
  alternates: { canonical: "/blogs" },
  openGraph: { type: "website", title: "CrackGov Blog | Guides & Updates", description: "Practical exam guides and education updates for your next step.", url: "/blogs" },
  twitter: { card: "summary_large_image", title: "CrackGov Blog | Guides & Updates", description: "Practical exam guides and education updates for your next step." },
};

export default async function BlogsPage() {
  const initialData = await getPublicBlogs({ page: 1, pageSize: 9 }).catch(() => null);
  return <BlogsDirectory initialData={initialData} />;
}
