import Link from "next/link";
import { ArrowUpRight, CalendarDays, ExternalLink } from "lucide-react";
import type { DailyCurrentAffair } from "@/types/current-affairs";
import { safeCurrentAffairsUrl } from "@/features/current-affairs/safeUrl";

function affairDate(value: string) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value.slice(0, 10)}T00:00:00`)); }

export function CurrentAffairsCard({ item }: { item: DailyCurrentAffair }) {
  const imageUrl = safeCurrentAffairsUrl(item.imageUrl);
  const sourceUrl = safeCurrentAffairsUrl(item.sourceUrl);
  return <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    {imageUrl ? <Link href={`/current-affairs/${item.slug}`} className="block aspect-[16/9] overflow-hidden bg-muted"><img src={imageUrl} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" /></Link> : <Link href={`/current-affairs/${item.slug}`} className="flex aspect-[16/9] items-end bg-gradient-to-br from-teal-100 via-cyan-50 to-amber-50 p-5 dark:from-teal-950 dark:via-slate-900 dark:to-amber-950"><span className="text-2xl font-black tracking-tight text-teal-900/20 dark:text-teal-100/20">DAILY BRIEF</span></Link>}
    <div className="flex flex-1 flex-col p-5 sm:p-6"><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarDays size={13} />{affairDate(item.affairDate)}</span>{item.category && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">{item.category}</span>}<span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.examRelevance === "High" ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : item.examRelevance === "Medium" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{item.examRelevance} relevance</span></div>
      <h2 className="mt-4 text-lg font-bold leading-snug tracking-tight"><Link href={`/current-affairs/${item.slug}`} className="transition-colors group-hover:text-primary">{item.pageTitle || item.title}</Link></h2><p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{item.excerpt || "Read this current affairs update and its exam takeaway."}</p>
      <div className="mt-5 flex items-center justify-between gap-3"><Link href={`/current-affairs/${item.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">Read update<ArrowUpRight size={14} /></Link>{sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer" aria-label="Open source" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink size={13} />Source</a>}</div>
    </div>
  </article>;
}
