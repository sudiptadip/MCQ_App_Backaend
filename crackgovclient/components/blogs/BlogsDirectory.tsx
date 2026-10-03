'use client';

import React from "react";
import { Search, Newspaper, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { getPublicBlogs } from "@/features/blogs/api";
import type { BlogPageData } from "@/types/blogs";
import { BlogCard } from "@/components/blogs/BlogCard";

const PAGE_SIZE = 9;

export function BlogsDirectory({ initialData }: { initialData: BlogPageData | null }) {
  const [data, setData] = React.useState(initialData);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(!initialData);
  const [error, setError] = React.useState("");
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      getPublicBlogs({ page, pageSize: PAGE_SIZE, search: search.trim() || undefined, category: category || undefined })
        .then(setData).catch((reason: Error) => { if (!controller.signal.aborted) setError(reason.message || "Unable to load articles."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 150);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [page, search, category, retry]);
  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE));
  return <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-10 sm:px-8 lg:px-10">
    <section className="relative overflow-hidden rounded-[2rem] bg-[#092f35] px-7 py-10 text-white shadow-xl shadow-teal-950/10 sm:px-12 sm:py-14 lg:px-16">
      <div className="absolute -right-16 -top-32 size-96 rounded-full bg-teal-400/15 blur-3xl" /><div className="absolute bottom-0 right-1/4 size-48 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="relative grid items-end gap-9 lg:grid-cols-[1fr_auto]"><div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-teal-100"><Newspaper size={14} /> CrackGov journal</span><h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Clear guidance for your next step.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">Exam explainers, application walkthroughs and updates to help you move forward with confidence.</p></div><div className="grid gap-3 sm:grid-cols-[minmax(240px,340px)_190px]"><label className="flex h-12 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 focus-within:border-teal-200"><Search size={17} className="shrink-0 text-white/60" /><input aria-label="Search articles" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search articles" className="w-full bg-transparent text-sm outline-none placeholder:text-white/50" /></label><select aria-label="Filter by category" value={category} onChange={(e) => { setPage(1); setCategory(e.target.value); }} className="h-12 rounded-xl border border-white/15 bg-[#123f45] px-4 text-sm text-white outline-none focus:border-teal-200"><option value="">All topics</option>{(data?.categories ?? []).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></div></div>
    </section>
    <div className="mb-6 mt-10 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Ideas & updates</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Latest articles</h2></div><p className="text-sm text-muted-foreground">{data?.totalCount ?? 0} {data?.totalCount === 1 ? "article" : "articles"}</p></div>
    {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center"><p className="font-semibold">Could not load blog posts</p><p className="mt-2 text-sm text-muted-foreground">{error}</p><button onClick={() => setRetry((value) => value + 1)} className="mt-4 text-sm font-semibold text-primary underline">Retry</button></div> : loading && !data ? <div className="flex items-center justify-center gap-3 py-24 text-muted-foreground"><LoaderCircle className="animate-spin" size={19} />Loading articles…</div> : data?.items.length ? <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((blog) => <BlogCard key={blog.id} blog={blog} />)}</div><div className="mt-10 flex items-center justify-center gap-4"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium disabled:opacity-40"><ChevronLeft size={15} />Previous</button><span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span><button disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium disabled:opacity-40">Next<ChevronRight size={15} /></button></div></> : <div className="rounded-3xl border border-dashed px-6 py-20 text-center"><Newspaper size={30} className="mx-auto text-muted-foreground" /><h3 className="mt-4 text-lg font-semibold">No articles found</h3><p className="mt-2 text-sm text-muted-foreground">Try another search or check back soon for new posts.</p></div>}
  </main>;
}
