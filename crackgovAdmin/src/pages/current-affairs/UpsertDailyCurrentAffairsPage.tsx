import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clipboard, Download, ImagePlus, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { getDailyCurrentAffairById, saveDailyCurrentAffair } from "../../features/current-affairs/api";
import { CURRENT_AFFAIRS_TEMPLATES, getCurrentAffairsTemplate } from "../../features/current-affairs/templates";
import type { DailyCurrentAffair, DailyAffairStatus, ExamRelevance } from "../../features/current-affairs/types";
import { showToast } from "../../utils/toast";

function localDate() { const date = new Date(); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10); }
const blankEntry: Partial<DailyCurrentAffair> = { affairDate: localDate(), title: "", slug: "", category: "", examRelevance: "Medium", excerpt: "", imageUrl: "", htmlContent: "", templateKey: "daily-brief", sourceName: "", sourceUrl: "", status: "Draft", isFeatured: false, pageTitle: "", metaTitle: "", metaDescription: "", metaKeywords: "", canonicalUrl: "" };
const slugify = (value: string) => value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 220);

export default function UpsertDailyCurrentAffairsPage() {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [entry, setEntry] = React.useState<Partial<DailyCurrentAffair>>(blankEntry);
  const [slugEdited, setSlugEdited] = React.useState(false);
  const query = useQuery({ queryKey: ["dailyCurrentAffairForEdit", editingId], enabled: !!editingId, queryFn: () => getDailyCurrentAffairById(editingId!) });
  React.useEffect(() => { if (query.data) { setEntry(query.data); setSlugEdited(true); } }, [query.data]);
  const mutation = useMutation({ mutationFn: saveDailyCurrentAffair, onSuccess: () => { showToast.success(editingId ? "Current affair updated" : "Current affair created"); queryClient.invalidateQueries({ queryKey: ["dailyCurrentAffairs"] }); navigate("/current-affairs"); }, onError: (error: Error) => showToast.error(error.message) });
  const inputClass = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  const areaClass = "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "mb-1.5 block text-sm font-medium";
  const setField = <K extends keyof DailyCurrentAffair>(key: K, value: DailyCurrentAffair[K]) => setEntry((current) => ({ ...current, [key]: value }));
  const template = getCurrentAffairsTemplate(entry.templateKey ?? "daily-brief");
  async function copyTemplate() { try { await navigator.clipboard.writeText(template.html); showToast.success(`${template.name} HTML copied`); } catch { showToast.error("Clipboard access was blocked by the browser"); } }
  function downloadTemplate() { const blob = new Blob([template.html], { type: "text/html;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `crackgov-${template.key}-template.html`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!entry.affairDate) return showToast.error("Choose the date for this current affairs item");
    if (!entry.title?.trim()) return showToast.error("Enter a title");
    if (!entry.htmlContent?.trim()) return showToast.error("Add the HTML content");
    const imageUrl = entry.imageUrl?.trim();
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return showToast.error("Image URL must start with https:// or http://");
    const sourceUrl = entry.sourceUrl?.trim();
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) return showToast.error("Source URL must start with https:// or http://");
    const canonicalUrl = entry.canonicalUrl?.trim();
    if (canonicalUrl && !/^https?:\/\//i.test(canonicalUrl)) return showToast.error("Canonical URL must start with https:// or http://");
    mutation.mutate({ ...entry, id: editingId ?? undefined, affairDate: entry.affairDate.slice(0, 10), slug: slugify(entry.slug || entry.title || ""), category: entry.category?.trim() || null, imageUrl: imageUrl || null, sourceName: entry.sourceName?.trim() || null, sourceUrl: sourceUrl || null, canonicalUrl: canonicalUrl || null });
  }

  return <div className="mx-auto max-w-6xl space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><CalendarDays size={25} /></div><div><h1 className="text-2xl font-bold">{editingId ? "Edit current affairs" : "Add daily current affairs"}</h1><p className="text-sm text-muted-foreground">Publish clear, dated updates with exam relevance and a verified source.</p></div></div><Button type="button" variant="outline" onClick={() => navigate("/current-affairs")}><ArrowLeft size={15} className="mr-2" />Back to current affairs</Button></div>
    {query.isLoading && editingId ? <div className="p-12 text-center text-muted-foreground">Loading current affairs…</div> : <form onSubmit={submit} className="space-y-6">
      <Card><CardHeader><CardTitle>Update details</CardTitle><CardDescription>Date, topic and source information displayed alongside the update.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div><label className={labelClass}>Current affairs date <span className="text-destructive">*</span></label><input type="date" className={inputClass} value={entry.affairDate?.slice(0, 10) ?? ""} required onChange={(e) => setField("affairDate", e.target.value)} /></div>
        <div><label className={labelClass}>Category</label><input className={inputClass} value={entry.category ?? ""} maxLength={100} placeholder="National, International, Economy..." onChange={(e) => setField("category", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Title <span className="text-destructive">*</span></label><input className={inputClass} value={entry.title ?? ""} maxLength={200} required placeholder="A clear headline for the update" onChange={(e) => { const title = e.target.value; setEntry((current) => ({ ...current, title, ...(!slugEdited ? { slug: slugify(title) } : {}) })); }} /></div>
        <div><label className={labelClass}>Exam relevance</label><select className={inputClass} value={entry.examRelevance ?? "Medium"} onChange={(e) => setField("examRelevance", e.target.value as ExamRelevance)}><option>High</option><option>Medium</option><option>Low</option></select></div>
        <div><label className={labelClass}>URL slug</label><div className="flex h-11 items-center rounded-lg border bg-background px-3"><span className="mr-1 shrink-0 text-xs text-muted-foreground">/current-affairs/</span><input className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" value={entry.slug ?? ""} maxLength={220} placeholder={slugify(entry.title || "affair-title")} onChange={(e) => { setSlugEdited(true); setField("slug", slugify(e.target.value)); }} /></div></div>
        <div className="sm:col-span-2"><label className={labelClass}>Short summary</label><textarea className={areaClass} value={entry.excerpt ?? ""} maxLength={500} placeholder="One or two sentences that summarize the update and its significance." onChange={(e) => setField("excerpt", e.target.value)} /><p className="mt-1 text-right text-xs text-muted-foreground">{entry.excerpt?.length ?? 0}/500</p></div>
        <div><label className={labelClass}>Source name</label><input className={inputClass} value={entry.sourceName ?? ""} maxLength={200} placeholder="Official ministry, organization or publication" onChange={(e) => setField("sourceName", e.target.value)} /></div>
        <div><label className={labelClass}>Source URL</label><input type="url" className={inputClass} value={entry.sourceUrl ?? ""} maxLength={1000} placeholder="https://official-source.gov.in/notice" onChange={(e) => setField("sourceUrl", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Image URL</label><div className="flex items-center gap-2"><ImagePlus size={17} className="shrink-0 text-muted-foreground" /><input type="url" className={inputClass} value={entry.imageUrl ?? ""} placeholder="https://example.com/current-affairs-cover.jpg" onChange={(e) => setField("imageUrl", e.target.value)} /></div>{entry.imageUrl && <img src={entry.imageUrl} alt="Current affairs cover preview" className="mt-3 max-h-60 w-full rounded-xl border object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />}</div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>HTML content and templates</CardTitle><CardDescription>Paste your HTML or use one of the current-affairs templates. Public articles remove scripts, unsafe links and embeds.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">{CURRENT_AFFAIRS_TEMPLATES.map((item) => <button key={item.key} type="button" onClick={() => setField("templateKey", item.key)} className={`rounded-xl border p-4 text-left transition ${entry.templateKey === item.key ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/60"}`}><span className="flex items-center justify-between font-semibold">{item.name}{entry.templateKey === item.key && <Sparkles size={15} className="text-primary" />}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span></button>)}</div>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setField("htmlContent", template.html)}>Use {template.name}</Button><Button type="button" variant="outline" onClick={copyTemplate}><Clipboard size={14} className="mr-2" />Copy HTML</Button><Button type="button" variant="outline" onClick={downloadTemplate}><Download size={14} className="mr-2" />Download HTML</Button></div>
        <div><label className={labelClass}>Article HTML <span className="text-destructive">*</span></label><textarea className={`${areaClass} min-h-[26rem] font-mono text-xs leading-6`} value={entry.htmlContent ?? ""} required spellCheck={false} placeholder="<article>\n  <h2>What happened?</h2>\n  <p>Write the verified update...</p>\n</article>" onChange={(e) => setField("htmlContent", e.target.value)} /></div>
        <div><p className={labelClass}>Preview</p><iframe title="Current affairs preview" sandbox="" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font:16px/1.7 system-ui,sans-serif;color:#1f2937;max-width:760px;margin:32px auto;padding:0 20px}h2{margin-top:1.8em}img{max-width:100%;height:auto}blockquote{border-left:3px solid #0e7490;padding-left:1rem;color:#475569}</style></head><body>${entry.htmlContent || "<p>Your content preview will appear here.</p>"}</body></html>`} className="h-72 w-full rounded-xl border bg-white" /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Publishing</CardTitle><CardDescription>Drafts remain private until published.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div><label className={labelClass}>Status</label><select className={inputClass} value={entry.status ?? "Draft"} onChange={(e) => setField("status", e.target.value as DailyAffairStatus)}><option value="Draft">Draft</option><option value="Published">Published</option><option value="Archived">Archived</option></select></div><label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={!!entry.isFeatured} onChange={(e) => setField("isFeatured", e.target.checked)} className="size-4 accent-primary" /><span><span className="block text-sm font-medium">Feature this update</span><span className="text-xs text-muted-foreground">Featured updates appear first in listings.</span></span></label></CardContent></Card>

      <Card><CardHeader><CardTitle>Search engine appearance</CardTitle><CardDescription>Set metadata for this dated current affairs page.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div><label className={labelClass}>Page title</label><input className={inputClass} value={entry.pageTitle ?? ""} maxLength={200} placeholder={entry.title || "Defaults to update title"} onChange={(e) => setField("pageTitle", e.target.value)} /></div>
        <div><label className={labelClass}>Meta title</label><input className={inputClass} value={entry.metaTitle ?? ""} maxLength={200} placeholder={`${entry.pageTitle || entry.title || "Current affairs"} | CrackGov`} onChange={(e) => setField("metaTitle", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Meta description</label><textarea className={areaClass} value={entry.metaDescription ?? ""} maxLength={320} placeholder="Search result summary. Defaults to the short summary." onChange={(e) => setField("metaDescription", e.target.value)} /><p className="mt-1 text-right text-xs text-muted-foreground">{entry.metaDescription?.length ?? 0}/320</p></div>
        <div className="sm:col-span-2"><label className={labelClass}>Meta keywords</label><input className={inputClass} value={entry.metaKeywords ?? ""} maxLength={500} placeholder="daily current affairs, exam updates, general knowledge" onChange={(e) => setField("metaKeywords", e.target.value)} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>Canonical URL (optional)</label><input type="url" className={inputClass} value={entry.canonicalUrl ?? ""} maxLength={1000} placeholder="Defaults to this public page URL" onChange={(e) => setField("canonicalUrl", e.target.value)} /></div>
        <div className="sm:col-span-2 rounded-xl border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search preview</p><p className="mt-2 truncate text-sm text-emerald-700 dark:text-emerald-400">crackgov/current-affairs/{entry.slug || slugify(entry.title || "current-affair")}</p><p className="mt-1 line-clamp-1 text-lg font-medium text-blue-700 dark:text-blue-400">{entry.metaTitle || entry.pageTitle || entry.title || "Current affairs title"} | CrackGov</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{entry.metaDescription || entry.excerpt || "Current affairs summary will appear here."}</p></div>
      </CardContent></Card>
      <div className="flex justify-end gap-3 pb-8"><Button type="button" variant="outline" onClick={() => navigate("/current-affairs")}>Cancel</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : editingId ? "Save changes" : "Publish current affair"}</Button></div>
    </form>}
  </div>;
}
