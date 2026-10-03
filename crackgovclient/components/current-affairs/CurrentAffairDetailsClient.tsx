'use client';

import React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, LoaderCircle, Newspaper } from "lucide-react";
import { getPublicCurrentAffair } from "@/features/current-affairs/api";
import { sanitizeBlogHtml } from "@/features/blogs/sanitizeHtml";
import { siteUrl } from "@/lib/site";
import { safeCurrentAffairsUrl } from "@/features/current-affairs/safeUrl";
import type { DailyCurrentAffair } from "@/types/current-affairs";

function dateLabel(value: string) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`)); }

export function CurrentAffairDetailsClient({ slug, initialItem }: { slug: string; initialItem: DailyCurrentAffair | null }) {
  const [item, setItem] = React.useState(initialItem);
  const [loading, setLoading] = React.useState(!initialItem);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    if (initialItem) return;
    setLoading(true); setItem(null); setError("");
    getPublicCurrentAffair(slug).then((result) => setItem(result)).catch((reason: Error) => setError(reason.message || "This current affairs item could not be found.")).finally(() => setLoading(false));
  }, [initialItem, slug]);
  if (loading) return <main className="mx-auto flex min-h-[65vh] max-w-4xl flex-col items-center justify-center px-5"><LoaderCircle size={28} className="animate-spin text-primary" /><p className="mt-4 text-sm text-muted-foreground">Loading current affairs…</p></main>;
  if (!item) return <main className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-5 text-center"><div className="rounded-2xl bg-primary/10 p-4 text-primary"><Newspaper size={27} /></div><h1 className="mt-5 text-3xl font-bold">Update unavailable</h1><p className="mt-2 text-muted-foreground">{error || "This update may have been moved or is no longer published."}</p><Link href="/current-affairs" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><ArrowLeft size={15} />Browse current affairs</Link></main>;
  const relevanceStyle = item.examRelevance === "High" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : item.examRelevance === "Medium" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground";
  const imageUrl = safeCurrentAffairsUrl(item.imageUrl);
  const sourceUrl = safeCurrentAffairsUrl(item.sourceUrl);
  const structuredData = { "@context": "https://schema.org", "@type": "NewsArticle", headline: item.pageTitle || item.title, description: item.metaDescription || item.excerpt, image: imageUrl ? [imageUrl] : undefined, datePublished: item.publishedOn || item.createdOn, dateModified: item.createdOn, author: { "@type": "Organization", name: "CrackGov Editorial Team" }, mainEntityOfPage: new URL(`/current-affairs/${item.slug}`, siteUrl).toString(), publisher: { "@type": "Organization", name: "CrackGov" } };
  return <main className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:px-10">
    <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-sm text-muted-foreground"><Link href="/current-affairs" className="inline-flex items-center gap-2 hover:text-foreground"><ArrowLeft size={14} />Current affairs</Link><span>/</span><span className="max-w-[55vw] truncate text-foreground">{item.title}</span></nav>
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14"><article className="min-w-0">
      <header className="mb-8"><div className="flex flex-wrap items-center gap-3">{item.category && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{item.category}</span>}<span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays size={14} />{dateLabel(item.affairDate)}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${relevanceStyle}`}>{item.examRelevance} exam relevance</span></div><h1 className="mt-5 text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl">{item.pageTitle || item.title}</h1>{item.excerpt && <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{item.excerpt}</p>}</header>
      {imageUrl && <div className="mb-9 overflow-hidden rounded-3xl border bg-muted"><img src={imageUrl} alt={item.title} className="max-h-[560px] w-full object-cover" /></div>}
      <div className={`current-affairs-content current-template-${item.templateKey || "daily-brief"} blog-article-content`} dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(item.htmlContent || "") }} />
      {sourceUrl && <section className="mt-10 rounded-2xl border bg-muted/30 p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">Source</p><a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 font-semibold hover:text-primary">{item.sourceName || "View source information"}<ExternalLink size={15} /></a><p className="mt-2 text-xs text-muted-foreground">Check the original source for the latest details and updates.</p></section>}
      <div className="mt-10 rounded-2xl border bg-muted/30 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Daily revision</p><h2 className="mt-2 text-2xl font-bold">Turn today’s update into progress.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Review the key facts, then explore practice materials for your exam preparation.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/practice" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Explore practice</Link><Link href="/current-affairs" className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"><ArrowLeft size={14} />All current affairs</Link></div></div>
    </article><aside className="sticky top-24 hidden rounded-3xl border bg-card p-6 lg:block"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Daily exam brief</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Use the summary and exam takeaway to review this update. Confirm facts with the original source.</p><div className="my-5 h-px bg-border" /><p className="text-xs text-muted-foreground">Current affairs date</p><p className="mt-1 font-semibold">{dateLabel(item.affairDate)}</p><p className="mt-4 text-xs text-muted-foreground">Exam relevance</p><p className="mt-1 font-semibold">{item.examRelevance}</p>{sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Official source <ExternalLink size={14} /></a>}</aside></div>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
  </main>;
}
