import type { MetadataRoute } from "next";
import { getPublicJobs } from "@/features/jobs/api";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: new URL("/", siteUrl).toString(), changeFrequency: "weekly", priority: 1 },
    { url: new URL("/jobs", siteUrl).toString(), changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const firstPage = await getPublicJobs({ page: 1, pageSize: 100 });
    const jobs = [...firstPage.items];
    const pageCount = Math.ceil(firstPage.totalCount / firstPage.pageSize);
    for (let page = 2; page <= pageCount; page += 1) {
      const result = await getPublicJobs({ page, pageSize: firstPage.pageSize });
      jobs.push(...result.items);
    }

    for (const job of jobs) {
      entries.push({
        url: new URL(`/jobs/${job.slug}`, siteUrl).toString(),
        lastModified: job.createdOn ? new Date(job.createdOn) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Keep the public sitemap available when the jobs API is temporarily unavailable.
  }

  return entries;
}
