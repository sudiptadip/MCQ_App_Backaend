import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clipboard, Download, FileText, ImagePlus, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { getBlogById, saveBlog } from "../../features/blogs/api";
import { BLOG_TEMPLATES, getBlogTemplate } from "../../features/blogs/templates";
import type { BlogPost, BlogStatus } from "../../features/blogs/types";
import { showToast } from "../../utils/toast";

const emptyBlog: Partial<BlogPost> = { title: "", slug: "", category: "", excerpt: "", imageUrl: "", htmlContent: "", templateKey: "editorial", authorName: "CrackGov Editorial Team", status: "Draft", isFeatured: false, pageTitle: "", metaTitle: "", metaDescription: "", metaKeywords: "", canonicalUrl: "" };
const slugify = (value: string) => value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 220);

export default function UpsertBlogPage() {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [blog, setBlog] = React.useState<Partial<BlogPost>>(emptyBlog);
  const [slugEdited, setSlugEdited] = React.useState(false);
  const query = useQuery({ queryKey: ["blogForEdit", editingId], enabled: !!editingId, queryFn: () => getBlogById(editingId!) });
  React.useEffect(() => { if (query.data) { setBlog(query.data); setSlugEdited(true); } }, [query.data]);
  const mutation = useMutation({ mutationFn: saveBlog, onSuccess: () => { showToast.success(editingId ? "Blog post updated" : "Blog post created"); queryClient.invalidateQueries({ queryKey: ["blogs"] }); navigate("/blogs"); }, onError: (error: Error) => showToast.error(error.message) });
  const inputClass = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  const areaClass = "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "mb-1.5 block text-sm font-medium";
  const setField = <K extends keyof BlogPost>(key: K, value: BlogPost[K]) => setBlog((current) => ({ ...current, [key]: value }));
  const template = getBlogTemplate(blog.templateKey ?? "editorial");
  async function copyTemplate() { try { await navigator.clipboard.writeText(template.html); showToast.success(`${template.name} HTML copied`); } catch { showToast.error("Clipboard access was blocked by the browser"); } }
  function downloadTemplate() { const file = new Blob([template.html], { type: "text/html;charset=utf-8" }); const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = `crackgov-${template.key}-template.html`; link.click(); URL.revokeObjectURL(url); }
  function insertTemplate() { setField("htmlContent", template.html); showToast.success(`${template.name} template loaded into the editor`); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!blog.title?.trim()) return showToast.error("Enter a blog title");
    if (!blog.htmlContent?.trim()) return showToast.error("Add the HTML article content");
    const imageUrl = blog.imageUrl?.trim();
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return showToast.error("Image URL must start with https:// or http://");
    mutation.mutate({ ...blog, id: editingId ?? undefined, slug: slugify(blog.slug || blog.title || ""), category: blog.category?.trim() || null, imageUrl: imageUrl || null, canonicalUrl: blog.canonicalUrl?.trim() || null });
  }

  return <div className="mx-auto max-w-6xl space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><FileText size={25} /></div><div><h1 className="text-2xl font-bold">{editingId ? "Edit blog post" : "Create blog post"}</h1><p className="text-sm text-muted-foreground">Paste HTML or start from one of the three downloadable article templates.</p></div></div><Button type="button" variant="outline" onClick={() => navigate("/blogs")}><ArrowLeft size={15} className="mr-2" />Back to blogs</Button></div>
    {query.isLoading && editingId ? <div className="p-12 text-center text-muted-foreground">Loading article…</div> : <form onSubmit={submit} className="space-y-6">
      <Card><CardHeader><CardTitle>Article information</CardTitle><CardDescription>Set the public title, category and social sharing image.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={labelClass}>Title <span className="text-destructive">*</span></label><input className={inputClass} value={blog.title ?? ""} maxLength={200} required placeholder="e.g. How to prepare for the civil service preliminary exam" onChange={(event) => { const title = event.target.value; setBlog((current) => ({ ...current, title, ...(!slugEdited ? { slug: slugify(title) } : {}) })); }} /></div>
        <div><label className={labelClass}>Category</label><input className={inputClass} value={blog.category ?? ""} maxLength={100} placeholder="Exam preparation, Updates..." onChange={(e) => setField("category", e.target.value)} /></div>
        <div><label className={labelClass}>Author</label><input className={inputClass} value={blog.authorName ?? ""} maxLength={120} placeholder="CrackGov Editorial Team" onChange={(e) => setField("authorName", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Short summary</label><textarea className={areaClass} value={blog.excerpt ?? ""} maxLength={500} placeholder="A concise summary for the blog listing and social previews." onChange={(e) => setField("excerpt", e.target.value)} /><p className="mt-1 text-right text-xs text-muted-foreground">{blog.excerpt?.length ?? 0}/500</p></div>
        <div className="sm:col-span-2"><label className={labelClass}>Image URL</label><div className="flex items-center gap-2"><ImagePlus size={17} className="shrink-0 text-muted-foreground" /><input type="url" className={inputClass} value={blog.imageUrl ?? ""} placeholder="https://example.com/article-cover.jpg" onChange={(e) => setField("imageUrl", e.target.value)} /></div><p className="mt-1 text-xs text-muted-foreground">Use a public HTTPS image URL. This image is used on article cards and social previews.</p>{blog.imageUrl && <img src={blog.imageUrl} alt="Article cover preview" className="mt-3 max-h-60 w-full rounded-xl border object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</div>
        <div className="sm:col-span-2"><label className={labelClass}>URL slug</label><div className="flex h-11 items-center rounded-lg border bg-background px-3"><span className="mr-1 shrink-0 text-xs text-muted-foreground">/blogs/</span><input className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" value={blog.slug ?? ""} maxLength={220} placeholder={slugify(blog.title || "article-title")} onChange={(e) => { setSlugEdited(true); setField("slug", slugify(e.target.value)); }} /></div></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>HTML article and templates</CardTitle><CardDescription>Paste your own HTML or insert, copy or download a starter template. Scripts and unsafe embeds are disabled on the public page.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">{BLOG_TEMPLATES.map((item) => <button key={item.key} type="button" onClick={() => setField("templateKey", item.key)} className={`rounded-xl border p-4 text-left transition ${blog.templateKey === item.key ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/60"}`}><span className="flex items-center justify-between font-semibold">{item.name}{blog.templateKey === item.key && <Sparkles size={15} className="text-primary" />}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span></button>)}</div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={insertTemplate}>Use {template.name}</Button><Button type="button" variant="outline" onClick={copyTemplate}><Clipboard size={14} className="mr-2" />Copy selected HTML</Button><Button type="button" variant="outline" onClick={downloadTemplate}><Download size={14} className="mr-2" />Download selected HTML</Button></div>
        <div><label className={labelClass}>Article HTML <span className="text-destructive">*</span></label><textarea className={`${areaClass} min-h-[26rem] font-mono text-xs leading-6`} value={blog.htmlContent ?? ""} required spellCheck={false} placeholder="<article>\n  <h2>Article heading</h2>\n  <p>Paste or write your HTML here...</p>\n</article>" onChange={(e) => setField("htmlContent", e.target.value)} /></div>
        <div><p className={labelClass}>Preview</p><iframe title="Blog HTML preview" sandbox="" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font:16px/1.7 system-ui,sans-serif;color:#1f2937;max-width:760px;margin:32px auto;padding:0 20px}h2{margin-top:1.8em}img{max-width:100%;height:auto}blockquote{border-left:3px solid #0e7490;padding-left:1rem;color:#475569}</style></head><body>${blog.htmlContent || "<p>Your article preview will appear here.</p>"}</body></html>`} className="h-72 w-full rounded-xl border bg-white" /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Publishing</CardTitle><CardDescription>Only published articles are visible to public visitors.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div><label className={labelClass}>Status</label><select className={inputClass} value={blog.status ?? "Draft"} onChange={(e) => setField("status", e.target.value as BlogStatus)}><option value="Draft">Draft</option><option value="Published">Published</option><option value="Archived">Archived</option></select></div><label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={!!blog.isFeatured} onChange={(e) => setField("isFeatured", e.target.checked)} className="size-4 accent-primary" /><span><span className="block text-sm font-medium">Feature article</span><span className="text-xs text-muted-foreground">Featured posts appear first in the blog listing.</span></span></label></CardContent></Card>

      <Card><CardHeader><CardTitle>Search engine appearance</CardTitle><CardDescription>Control the search title, description and canonical URL for this article.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div><label className={labelClass}>Page title</label><input className={inputClass} value={blog.pageTitle ?? ""} maxLength={200} placeholder={blog.title || "Defaults to article title"} onChange={(e) => setField("pageTitle", e.target.value)} /></div>
        <div><label className={labelClass}>Meta title</label><input className={inputClass} value={blog.metaTitle ?? ""} maxLength={200} placeholder={`${blog.pageTitle || blog.title || "Article title"} | CrackGov`} onChange={(e) => setField("metaTitle", e.target.value)} /><p className="mt-1 text-xs text-muted-foreground">Aim for about 50–60 characters.</p></div>
        <div className="sm:col-span-2"><label className={labelClass}>Meta description</label><textarea className={areaClass} value={blog.metaDescription ?? ""} maxLength={320} placeholder="Search result summary, defaults to the article summary." onChange={(e) => setField("metaDescription", e.target.value)} /><p className="mt-1 text-right text-xs text-muted-foreground">{blog.metaDescription?.length ?? 0}/320 · Aim for about 150–160 characters.</p></div>
        <div className="sm:col-span-2"><label className={labelClass}>Meta keywords</label><input className={inputClass} value={blog.metaKeywords ?? ""} maxLength={500} placeholder="government exams, exam preparation, recruitment" onChange={(e) => setField("metaKeywords", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Canonical URL (optional)</label><input type="url" className={inputClass} value={blog.canonicalUrl ?? ""} maxLength={1000} placeholder="Defaults to this blog's public URL" onChange={(e) => setField("canonicalUrl", e.target.value)} /></div>
        <div className="sm:col-span-2 rounded-xl border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search preview</p><p className="mt-2 truncate text-sm text-emerald-700 dark:text-emerald-400">crackgov/blogs/{blog.slug || slugify(blog.title || "article-title")}</p><p className="mt-1 line-clamp-1 text-lg font-medium text-blue-700 dark:text-blue-400">{blog.metaTitle || blog.pageTitle || blog.title || "Article title"} | CrackGov</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{blog.metaDescription || blog.excerpt || "Article summary will appear here."}</p></div>
      </CardContent></Card>
      <div className="flex justify-end gap-3 pb-8"><Button type="button" variant="outline" onClick={() => navigate("/blogs")}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : editingId ? "Save changes" : "Create blog post"}</Button></div>
    </form>}
  </div>;
}
