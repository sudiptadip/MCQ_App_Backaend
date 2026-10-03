import type { MetadataRoute } from "next";
import { getPublicJobs } from "@/features/jobs/api";
import { getPublicBlogs } from "@/features/blogs/api";
import { getPublicCurrentAffairs } from "@/features/current-affairs/api";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: new URL("/", siteUrl).toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/jobs", siteUrl).toString(), changeFrequency: "daily", priority: 0.9 },
    { url: new URL("/blogs", siteUrl).toString(), changeFrequency: "daily", priority: 0.8 },
    { url: new URL("/current-affairs", siteUrl).toString(), changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const firstPage = await getPublicJobs({ page: 1, pageSize: 100 });
    const jobs = [...firstPage.items];
    const pageCount = Math.ceil(firstPage.totalCount / firstPage.pageSize);
    for (let page = 2; page <= pageCount; page += 1) jobs.push(...(await getPublicJobs({ page, pageSize: firstPage.pageSize })).items);
    for (const job of jobs) entries.push({
      url: new URL(`/jobs/${job.slug}`, siteUrl).toString(),
      lastModified: job.createdOn ? new Date(job.createdOn) : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  } catch {
    // Keep the public sitemap available when the jobs API is temporarily unavailable.
  }

  try {
    const firstPage = await getPublicBlogs({ page: 1, pageSize: 100 });
    const blogs = [...firstPage.items];
    const pageCount = Math.ceil(firstPage.totalCount / firstPage.pageSize);
    for (let page = 2; page <= pageCount; page += 1) blogs.push(...(await getPublicBlogs({ page, pageSize: firstPage.pageSize })).items);
    for (const blog of blogs) entries.push({
      url: new URL(`/blogs/${blog.slug}`, siteUrl).toString(),
      lastModified: blog.publishedOn ? new Date(blog.publishedOn) : blog.createdOn ? new Date(blog.createdOn) : undefined,
      changeFrequency: "monthly",
      priority: blog.isFeatured ? 0.8 : 0.6,
    });
  } catch {
    // Keep the sitemap available when the blog API is temporarily unavailable.
  }

  try {
    const firstPage = await getPublicCurrentAffairs({ page: 1, pageSize: 100 });
    const items = [...firstPage.items];
    const pageCount = Math.ceil(firstPage.totalCount / firstPage.pageSize);
    for (let page = 2; page <= pageCount; page += 1) items.push(...(await getPublicCurrentAffairs({ page, pageSize: firstPage.pageSize })).items);
    for (const item of items) entries.push({
      url: new URL(`/current-affairs/${item.slug}`, siteUrl).toString(),
      lastModified: item.publishedOn ? new Date(item.publishedOn) : item.createdOn ? new Date(item.createdOn) : undefined,
      changeFrequency: "daily",
      priority: item.isFeatured ? 0.85 : 0.7,
    });
  } catch {
    // Keep the sitemap available when the current affairs API is temporarily unavailable.
  }

  return entries;
}
