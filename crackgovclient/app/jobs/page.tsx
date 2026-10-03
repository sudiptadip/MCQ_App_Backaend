import { JobsDirectory } from "@/components/jobs/JobsDirectory";
import type { Metadata } from "next";
import { getPublicJobs } from "@/features/jobs/api";

export const metadata: Metadata = {
  title: "Latest Government Job Openings & Notifications",
  description: "Browse current government and public-sector job openings. Compare departments, eligibility, salary, vacancies and application deadlines, with links to official notices.",
  keywords: ["latest government jobs", "government vacancy", "sarkari naukri", "job notifications", "public sector jobs", "government recruitment"],
  alternates: { canonical: "/jobs" },
  openGraph: {
    type: "website",
    title: "Latest Government Job Openings | CrackGov",
    description: "Browse current public-sector vacancies with eligibility details, deadlines and official application links.",
    url: "/jobs",
  },
  twitter: { card: "summary", title: "Latest Government Job Openings | CrackGov", description: "Browse government vacancies and official application information." },
};

export default async function JobsPage() {
  const initialData = await getPublicJobs({ page: 1, pageSize: 9 }).catch(() => null);
  return <JobsDirectory initialData={initialData} />;
}
