'use client';

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, LoaderCircle, Newspaper } from "lucide-react";
import { getPublicBlog } from "@/features/blogs/api";
import { sanitizeBlogHtml } from "@/features/blogs/sanitizeHtml";
import { siteUrl } from "@/lib/site";
import type { BlogPost } from "@/types/blogs";

function dateLabel(value: string | null) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function BlogDetailsClient({ slug, initialBlog }: { slug: string; initialBlog: BlogPost | null }) {
  const [blog, setBlog] = React.useState(initialBlog);
  const [loading, setLoading] = React.useState(!initialBlog);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    if (initialBlog) return;
    setLoading(true);
    setBlog(null);
    setError("");
    getPublicBlog(slug).then((result) => { setBlog(result); setError(""); }).catch((reason: Error) => setError(reason.message || "This article could not be found." )).finally(() => setLoading(false));
  }, [initialBlog, slug]);
  if (loading) return <main className="mx-auto flex min-h-[65vh] max-w-4xl flex-col items-center justify-center px-5"><LoaderCircle size={28} className="animate-spin text-primary" /><p className="mt-4 text-sm text-muted-foreground">Loading article…</p></main>;
  if (!blog) return <main className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-5 text-center"><div className="rounded-2xl bg-primary/10 p-4 text-primary"><Newspaper size={27} /></div><h1 className="mt-5 text-3xl font-bold">Article unavailable</h1><p className="mt-2 text-muted-foreground">{error || "This article may have been moved or is no longer published."}</p><Link href="/blogs" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><ArrowLeft size={15} />Browse all articles</Link></main>;
  const published = blog.publishedOn || blog.createdOn;
  const structuredData = { "@context": "https://schema.org", "@type": "BlogPosting", headline: blog.pageTitle || blog.title, description: blog.metaDescription || blog.excerpt, image: blog.imageUrl ? [blog.imageUrl] : undefined, datePublished: blog.publishedOn || blog.createdOn, author: { "@type": "Organization", name: blog.authorName || "CrackGov" }, mainEntityOfPage: new URL(`/blogs/${blog.slug}`, siteUrl).toString(), publisher: { "@type": "Organization", name: "CrackGov" } };
  return <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:px-10">
    <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-sm text-muted-foreground"><Link href="/blogs" className="inline-flex items-center gap-2 hover:text-foreground"><ArrowLeft size={14} />Blog</Link><span>/</span><span className="max-w-[55vw] truncate text-foreground">{blog.title}</span></nav>
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
      <article className="min-w-0">
        <header className="mb-8"><div className="flex flex-wrap items-center gap-3">{blog.category && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{blog.category}</span>}<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays size={14} />{dateLabel(published)}</span></div><h1 className="mt-5 text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl">{blog.pageTitle || blog.title}</h1>{blog.excerpt && <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{blog.excerpt}</p>}<p className="mt-5 text-sm font-medium text-muted-foreground">By {blog.authorName || "CrackGov Editorial Team"}</p></header>
        {blog.imageUrl && <div className="mb-9 overflow-hidden rounded-3xl border bg-muted"><img src={blog.imageUrl} alt={blog.title} className="max-h-[560px] w-full object-cover" /></div>}
        <div className={`blog-article-content blog-template-${blog.templateKey || "editorial"}`} dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(blog.htmlContent || "") }} />
        <div className="mt-12 rounded-2xl border bg-muted/30 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Keep moving forward</p><h2 className="mt-2 text-2xl font-bold">Put the next step into practice.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Explore practice materials and current government job openings with CrackGov.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/practice" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Explore practice</Link><Link href="/jobs" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold">Browse jobs<ArrowUpRight size={14} /></Link></div></div>
      </article>
      <aside className="sticky top-24 hidden rounded-3xl border bg-card p-6 lg:block"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">In this article</p><p className="mt-3 text-sm leading-6 text-muted-foreground">{blog.excerpt || "Useful guidance and updates from the CrackGov editorial team."}</p><div className="my-5 h-px bg-border" /><p className="text-xs text-muted-foreground">Published {dateLabel(published)}</p><Link href="/blogs" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft size={14} />All articles</Link></aside>
    </div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
  </main>;
}
