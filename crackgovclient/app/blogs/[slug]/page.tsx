import type { Metadata } from "next";
import { BlogDetailsClient } from "@/components/blogs/BlogDetailsClient";
import { getPublicBlog } from "@/features/blogs/api";
import { siteUrl } from "@/lib/site";
import type { BlogPost } from "@/types/blogs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublicBlog(slug).catch(() => null);
  const title = blog?.metaTitle || blog?.pageTitle || blog?.title || "CrackGov Blog";
  const description = blog?.metaDescription || blog?.excerpt || "Practical government exam guides and education updates from CrackGov.";
  const canonical = blog?.canonicalUrl || new URL(`/blogs/${slug}`, siteUrl).toString();
  return {
    title,
    description,
    keywords: blog?.metaKeywords?.split(",").map((word) => word.trim()).filter(Boolean),
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical, publishedTime: blog?.publishedOn || undefined, images: blog?.imageUrl ? [{ url: blog.imageUrl, alt: blog.title }] : undefined },
    twitter: { card: blog?.imageUrl ? "summary_large_image" : "summary", title, description, images: blog?.imageUrl ? [blog.imageUrl] : undefined },
  };
}

export default async function BlogDetailsPage({ params }: Props) {
  const { slug } = await params;
  const initialBlog = await getPublicBlog(slug).catch((): BlogPost | null => null);
  return <BlogDetailsClient slug={slug} initialBlog={initialBlog} />;
}
