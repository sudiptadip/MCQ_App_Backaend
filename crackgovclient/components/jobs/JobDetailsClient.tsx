"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  MapPin,
  Users,
} from "lucide-react";
import { getPublicJob } from "@/features/jobs/api";
import type { JobPost } from "@/types/jobs";
import { siteUrl } from "@/lib/site";

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", options);
}

function DetailSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300">{icon}</span>
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
      </div>
      <div className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function OverviewItem({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-teal-700 dark:text-teal-300">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
      </div>
    </div>
  );
}

function JobPostingJsonLd({ job }: { job: JobPost }) {
  const jobPosting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: [job.description, job.qualification && `Qualification: ${job.qualification}`, job.eligibility && `Eligibility: ${job.eligibility}`].filter(Boolean).join("\n\n"),
    identifier: job.referenceNumber ? { "@type": "PropertyValue", name: job.department, value: job.referenceNumber } : undefined,
    datePosted: job.createdOn ? new Date(job.createdOn).toISOString().slice(0, 10) : undefined,
    validThrough: job.applicationDeadline ? `${job.applicationDeadline.slice(0, 10)}T23:59:00+05:30` : undefined,
    employmentType: ({ "Full-time": "FULL_TIME", "Part-time": "PART_TIME", Contract: "CONTRACTOR", Temporary: "TEMPORARY", Apprenticeship: "INTERN" } as Record<string, string>)[job.employmentType] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: job.department },
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "IN" } },
    industry: job.categoryName,
    educationRequirements: job.qualification,
    directApply: Boolean(job.applicationUrl),
    url: new URL(`/jobs/${job.slug}`, siteUrl).toString(),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPosting).replace(/</g, "\\u003c") }} />;
}

export function JobDetailsClient({ slug, initialJob }: { slug: string; initialJob: JobPost | null }) {
  const [job, setJob] = useState<JobPost | null>(initialJob);
  const [loading, setLoading] = useState(!initialJob);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (initialJob) {
      setJob(initialJob);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    getPublicJob(slug)
      .then((result) => {
        if (active) setJob(result);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message || "We couldn’t find this job posting.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, initialJob, retryKey]);

  if (loading) {
    return (
      <div className="flex-1">
        <div className="h-[24rem] animate-pulse bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950" />
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
          <div className="space-y-5"><div className="h-48 animate-pulse rounded-3xl bg-muted" /><div className="h-40 animate-pulse rounded-3xl bg-muted" /></div>
          <div className="h-72 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto flex min-h-[65vh] w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300"><BriefcaseBusiness size={26} /></span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Job details</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn’t find this opening</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{error || "This job may have closed or the link may have changed. Browse the current openings to find another role."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => setRetryKey((value) => value + 1)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-85">Try again <ArrowRight size={15} /></button>
          <Link href="/jobs" className="inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition hover:bg-muted"><ArrowLeft size={15} /> Browse jobs</Link>
        </div>
      </div>
    );
  }

  const deadline = job.applicationDeadline ? formatDate(job.applicationDeadline) : "See official notification";
  const startDate = job.applicationStartDate ? formatDate(job.applicationStartDate) : null;

  return (
    <div className="flex-1">
      <JobPostingJsonLd job={job} />

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 h-[28rem] w-[28rem] rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white"><ArrowLeft size={15} /> All jobs</Link>

          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_350px] lg:items-center lg:gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100">{job.categoryName}</span>
                {job.isFeatured && <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100">Featured role</span>}
                {job.referenceNumber && <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-white/75">Ref. {job.referenceNumber}</span>}
              </div>
              <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">{job.pageTitle?.trim() || job.title}</h1>
              <p className="mt-3 flex items-center gap-2 text-base text-slate-300 sm:text-lg"><Building2 size={18} className="shrink-0 text-teal-300" /> {job.department}</p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-2.5 text-sm text-slate-100"><MapPin size={15} className="text-teal-300" />{job.location}</span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-2.5 text-sm text-slate-100"><BriefcaseBusiness size={15} className="text-teal-300" />{job.employmentType}</span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3.5 py-2.5 text-sm text-slate-100"><Users size={15} className="text-teal-300" />{job.vacancies} {job.vacancies === 1 ? "vacancy" : "vacancies"}</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/15 backdrop-blur-md sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-300/15 text-teal-200"><CalendarDays size={19} /></span>
                <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Application deadline</p><p className="mt-1 text-lg font-bold text-white">{deadline}</p></div>
              </div>
              <div className="mt-5 grid gap-3">
                {job.applicationUrl ? (
                  <a href={job.applicationUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">Apply on official site <ExternalLink size={16} /></a>
                ) : (
                  <div className="rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-slate-300">Application link not provided. Check the official notification.</div>
                )}
                {job.notificationUrl && <a href={job.notificationUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:bg-white/10"><FileText size={16} /> Read official notification <ExternalLink size={14} /></a>}
              </div>
              <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-300"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-teal-300" /> Confirm eligibility and dates in the official notice before applying.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="space-y-5">
          <DetailSection title="About this opportunity" icon={<BriefcaseBusiness size={19} />}>{job.description}</DetailSection>
          <DetailSection title="Qualification" icon={<CheckCircle2 size={19} />}>{job.qualification}</DetailSection>
          {job.responsibilities?.trim() && <DetailSection title="Responsibilities" icon={<ArrowRight size={19} />}>{job.responsibilities}</DetailSection>}
          {job.eligibility?.trim() && <DetailSection title="Additional eligibility" icon={<FileText size={19} />}>{job.eligibility}</DetailSection>}
          <div className="rounded-2xl border border-teal-700/15 bg-teal-700/[0.04] p-4 text-sm leading-6 text-muted-foreground">Job information is provided as a summary. Always read the official notification for complete terms, eligibility rules, and application instructions.</div>
        </div>

        <aside className="h-fit rounded-3xl border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">At a glance</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Job overview</h2>
          <dl className="mt-5 space-y-5">
            <OverviewItem label="Application deadline" value={deadline} icon={<CalendarDays size={17} />} />
            {startDate && <OverviewItem label="Applications open" value={startDate} icon={<Clock3 size={17} />} />}
            {job.salaryText && <OverviewItem label="Salary / pay scale" value={job.salaryText} icon={<BadgeIndianRupee size={17} />} />}
            {job.ageLimit && <OverviewItem label="Age limit" value={job.ageLimit} icon={<Users size={17} />} />}
            {job.referenceNumber && <OverviewItem label="Reference number" value={job.referenceNumber} icon={<FileText size={17} />} />}
            <OverviewItem label="Employment type" value={job.employmentType} icon={<BriefcaseBusiness size={17} />} />
          </dl>
          <Link href="/jobs" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted">Browse all openings <ArrowRight size={15} /></Link>
        </aside>
      </div>
    </div>
  );
}
