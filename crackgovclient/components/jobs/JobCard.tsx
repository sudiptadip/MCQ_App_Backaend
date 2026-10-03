import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  BriefcaseBusiness,
  Users,
} from "lucide-react";
import type { JobPost } from "@/types/jobs";

export function JobCard({ job, compact = false }: { job: JobPost; compact?: boolean }) {
  const deadline = job.applicationDeadline
    ? new Date(`${job.applicationDeadline.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "See official notice";

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-teal-600/35 hover:shadow-xl hover:shadow-slate-900/[0.08] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-300 opacity-75 transition group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
            <BriefcaseBusiness size={20} />
          </span>
          <div className="min-w-0">
            <span className="inline-flex max-w-full truncate rounded-full bg-teal-500/10 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-200">
              {job.categoryName}
            </span>
          </div>
        </div>
        {job.isFeatured && (
          <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
            Featured
          </span>
        )}
      </div>

      <div className="mt-5">
        <h3 className="line-clamp-2 text-xl font-bold leading-snug tracking-tight sm:text-2xl">{job.title}</h3>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">{job.department}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">{job.employmentType}</span>
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{job.location}</span>
        </span>
      </div>

      {!compact && (
        <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">{job.description}</p>
      )}

      <div className="mt-auto pt-5">
        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/55 p-3.5">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarDays size={13} /> Deadline
            </span>
            <p className="mt-1.5 truncate text-sm font-semibold">{deadline}</p>
          </div>
          <div className="min-w-0 border-l pl-3">
            <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Users size={13} /> Vacancies
            </span>
            <p className="mt-1.5 truncate text-sm font-semibold">{job.vacancies} {job.vacancies === 1 ? "opening" : "openings"}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {job.salaryText ? (
            <p className="text-sm font-semibold">{job.salaryText}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Salary in official notice</p>
          )}
          <Link
            href={`/jobs/${job.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:bg-teal-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            Details <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
