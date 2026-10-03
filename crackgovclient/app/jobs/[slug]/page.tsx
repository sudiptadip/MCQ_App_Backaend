import type { Metadata } from "next";
import { cache } from "react";
import { getPublicJob } from "@/features/jobs/api";
import type { JobPost } from "@/types/jobs";
import { JobDetailsClient } from "@/components/jobs/JobDetailsClient";

const loadJob = cache(async (slug: string): Promise<JobPost | null> => {
  try {
    return await getPublicJob(slug);
  } catch {
    return null;
  }
});

function getJobDescription(job: JobPost) {
  const text = `${job.description} ${job.qualification ? `Eligibility: ${job.qualification}` : ""}`.replace(/\s+/g, " ").trim();
  return text.length > 155 ? `${text.slice(0, 152).trimEnd()}...` : text;
}

function titleFromSlug(slug: string) {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const job = await loadJob(slug);

  if (!job) {
    const title = `${titleFromSlug(slug)} Recruitment | CrackGov`;
    return {
      title,
      description: `View ${titleFromSlug(slug)} job details, qualifications, vacancies, application deadline, and official application information.`,
      alternates: { canonical: `/jobs/${slug}` },
      robots: { index: true, follow: true },
    };
  }

  const title = job.metaTitle?.trim() || job.pageTitle?.trim() || `${job.title} Recruitment${job.referenceNumber ? ` | ${job.referenceNumber}` : ""}`;
  const description = job.metaDescription?.trim() || getJobDescription(job);
  const url = `/jobs/${job.slug}`;
  const keywords = (job.metaKeywords ?? "").split(",").map((keyword) => keyword.trim()).filter(Boolean);

  return {
    title,
    description,
    keywords: [...new Set([...keywords, job.title, `${job.department} recruitment`, `${job.categoryName} jobs`, "government vacancy", "eligibility", "application deadline"])],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${title} | CrackGov`,
      description,
      url,
      siteName: "CrackGov",
      publishedTime: job.createdOn,
      locale: "en_IN",
    },
    twitter: { card: "summary", title: `${title} | CrackGov`, description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

export default async function JobDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const initialJob = await loadJob(slug);
  return <JobDetailsClient slug={slug} initialJob={initialJob} />;
}
