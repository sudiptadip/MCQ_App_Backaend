"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { getPublicJobs, type PublicJobPage } from "@/features/jobs/api";
import { JobCard } from "@/components/jobs/JobCard";

const PAGE_SIZE = 9;

export function JobsDirectory({ initialData }: { initialData: PublicJobPage | null }) {
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<PublicJobPage | null>(initialData);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(!initialData);
  const [retryKey, setRetryKey] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getPublicJobs({ page, pageSize: PAGE_SIZE, search, categoryId: categoryId || undefined })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, search, categoryId, retryKey]);

  const pageCount = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE));
  const hasFilters = Boolean(search || categoryId);

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setCategoryId(0);
    setPage(1);
  }

  return (
    <div className="flex-1">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 h-[28rem] w-[28rem] rounded-full bg-teal-400/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-[28%] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 transition hover:text-white">
            <ArrowLeft size={15} /> Home
          </Link>

          <div className="mt-8 grid gap-9 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">
                <BriefcaseBusiness size={14} /> CrackGov careers
              </span>
              <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Your next opportunity starts here.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Explore current government and public-sector openings. Review the details, check the deadline, and apply through the official notice.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-200">
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-300" /> Verified listing details</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-teal-300" /> Official application links</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl shadow-black/15 backdrop-blur-md sm:p-7">
              <div className="mb-5">
                <p className="text-lg font-semibold">Find the right opening</p>
                <p className="mt-1 text-sm text-slate-300">Search by role, department, location, or category.</p>
              </div>
              <label className="block">
                <span className="sr-only">Search jobs or departments</span>
                <span className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm transition focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/15">
                  <Search size={18} />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search jobs or departments"
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </span>
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-300">Job category</span>
                <select
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15"
                >
                  <option value={0}>All job categories</option>
                  {(data?.categories ?? []).map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-slate-300">{loading ? "Updating results…" : `${data?.totalCount ?? 0} open ${(data?.totalCount ?? 0) === 1 ? "role" : "roles"}`}</span>
                {hasFilters && (
                  <button onClick={clearFilters} className="font-medium text-teal-200 transition hover:text-white">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Opportunities</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Latest openings</h2>
          </div>
          {!loading && !error && (
            <p className="text-sm text-muted-foreground">
              {data?.totalCount ?? 0} {data?.totalCount === 1 ? "position" : "positions"}
              {hasFilters ? " found" : " available"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-3xl border bg-muted/50" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-destructive/25 bg-destructive/[0.04] px-6 py-14 text-center">
            <BriefcaseBusiness size={30} className="mx-auto text-destructive/70" />
            <h2 className="mt-4 text-lg font-semibold">We couldn’t load the openings</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-85"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              Try again <ArrowRight size={15} />
            </button>
          </div>
        ) : data?.items.length ? (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {data.items.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
            <div className="mt-9 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">Page {page} of {pageCount}</span>
              <button
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={page >= pageCount}
                className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed bg-muted/20 px-6 py-16 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
              <BriefcaseBusiness size={25} />
            </span>
            <h2 className="mt-4 text-xl font-semibold">No matching openings</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Try a different search or category. New government and public-sector roles will appear here as they are published.
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-5 text-sm font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-300">
                Clear search and filters
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
