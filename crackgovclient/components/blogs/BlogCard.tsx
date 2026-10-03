import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3 } from "lucide-react";
import type { BlogPost } from "@/types/blogs";

function dateLabel(value: string | null) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function BlogCard({ blog }: { blog: BlogPost }) {
  return <article className="group flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    <Link href={`/blogs/${blog.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-gradient-to-br from-teal-100 via-cyan-50 to-amber-50 dark:from-teal-950 dark:via-slate-900 dark:to-amber-950" aria-label={`Read ${blog.title}`}>
      {blog.imageUrl ? <img src={blog.imageUrl} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" /> : <div className="flex size-full items-end p-6"><span className="text-3xl font-black tracking-tight text-teal-900/20 dark:text-teal-100/20">CRACKGOV</span></div>}
      {blog.category && <span className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-xs font-bold text-teal-900 shadow-sm backdrop-blur">{blog.category}</span>}
    </Link>
    <div className="flex flex-1 flex-col p-6 sm:p-7">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><CalendarDays size={14} />{dateLabel(blog.publishedOn || blog.createdOn)}<span>·</span><Clock3 size={14} />{Math.max(2, Math.ceil((blog.excerpt?.split(/\s+/).length ?? 80) / 180))} min read</p>
      <h2 className="mt-4 text-xl font-bold leading-snug tracking-tight sm:text-2xl"><Link href={`/blogs/${blog.slug}`} className="transition-colors group-hover:text-primary">{blog.pageTitle || blog.title}</Link></h2>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-muted-foreground">{blog.excerpt || "Read the latest guidance, explainers and updates from CrackGov."}</p>
      <Link href={`/blogs/${blog.slug}`} className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary">Read article <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
    </div>
  </article>;
}
