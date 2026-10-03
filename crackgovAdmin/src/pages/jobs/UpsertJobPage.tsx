import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness, Plus, Star } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { createJobCategory, getJobById, getJobCategories, saveJob } from "../../features/jobs/api";
import type { JobPost, JobStatus } from "../../features/jobs/types";
import { showToast } from "../../utils/toast";

const blankJob: Partial<JobPost> = { title: "", department: "", categoryId: 0, employmentType: "Full-time", location: "", vacancies: 1, salaryText: "", qualification: "", ageLimit: "", applicationStartDate: null, applicationDeadline: null, description: "", responsibilities: "", eligibility: "", applicationUrl: "", notificationUrl: "", referenceNumber: "", status: "Draft", isFeatured: false, slug: "", pageTitle: "", metaTitle: "", metaDescription: "", metaKeywords: "" };

function toSlug(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 220);
}

function normalizeSlugInput(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").slice(0, 220);
}

export default function UpsertJobPage() {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [job, setJob] = React.useState<Partial<JobPost>>(blankJob);
  const [categoryName, setCategoryName] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);
  const categoriesQuery = useQuery({ queryKey: ["jobCategories"], queryFn: getJobCategories });
  const jobQuery = useQuery({ queryKey: ["jobForEdit", editingId], enabled: !!editingId, queryFn: () => getJobById(editingId!) });
  React.useEffect(() => { if (jobQuery.data) { setJob(jobQuery.data); setSlugEdited(true); } }, [jobQuery.data]);

  const saveMutation = useMutation({ mutationFn: saveJob, onSuccess: () => {
    showToast.success(editingId ? "Job post updated" : "Job post created");
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    navigate("/jobs");
  }, onError: (error: Error) => showToast.error(error.message) });
  const categoryMutation = useMutation({ mutationFn: createJobCategory, onSuccess: (category) => {
    queryClient.invalidateQueries({ queryKey: ["jobCategories"] });
    setJob((current) => ({ ...current, categoryId: category.id }));
    setCategoryName("");
    showToast.success("Category added");
  }, onError: (error: Error) => showToast.error(error.message) });

  const setField = <K extends keyof JobPost>(key: K, value: JobPost[K]) => setJob((current) => ({ ...current, [key]: value }));
  const inputClass = "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
  const areaClass = "min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "mb-1.5 block text-sm font-medium";
  const required = <span className="text-destructive"> *</span>;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!job.categoryId) return showToast.error("Choose a job category");
    saveMutation.mutate({ ...job, id: editingId ?? undefined, slug: toSlug(job.slug || ""), vacancies: Number(job.vacancies), applicationStartDate: job.applicationStartDate || null, applicationDeadline: job.applicationDeadline || null });
  }

  return <div className="mx-auto max-w-5xl space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><BriefcaseBusiness size={25} /></div><div><h1 className="text-2xl font-bold">{editingId ? "Edit job post" : "Create job post"}</h1><p className="text-sm text-muted-foreground">Add clear details so candidates can quickly understand this opportunity.</p></div></div>
      <Button type="button" variant="outline" onClick={() => navigate("/jobs")}><ArrowLeft size={15} className="mr-2" />Back to jobs</Button>
    </div>
    {(jobQuery.isLoading && editingId) ? <div className="p-12 text-center text-muted-foreground">Loading job details…</div> : <form onSubmit={submit} className="space-y-6">
      <Card><CardHeader><CardTitle>Position details</CardTitle><CardDescription>Role, category, location and employment information.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={labelClass}>Job title{required}</label><input className={inputClass} value={job.title ?? ""} onChange={(e) => { const title = e.target.value; setJob((current) => ({ ...current, title, ...(!slugEdited ? { slug: toSlug(title) } : {}) })); }} maxLength={200} required placeholder="e.g. Staff Nurse Recruitment 2026" /></div>
        <div><label className={labelClass}>Department / recruiting organization{required}</label><input className={inputClass} value={job.department ?? ""} onChange={(e) => setField("department", e.target.value)} maxLength={200} required placeholder="e.g. State Health Department" /></div>
        <div><label className={labelClass}>Category{required}</label><select className={inputClass} value={job.categoryId || ""} onChange={(e) => setField("categoryId", Number(e.target.value))} required><option value="" disabled>Select a category</option>{(categoriesQuery.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="sm:col-span-2 flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"><div className="min-w-52 flex-1"><label className={labelClass}>Add a category</label><input className={inputClass} value={categoryName} onChange={(e) => setCategoryName(e.target.value)} maxLength={100} placeholder="e.g. Banking, Railways, Teaching" /></div><Button type="button" variant="outline" disabled={!categoryName.trim() || categoryMutation.isPending} onClick={() => categoryMutation.mutate(categoryName.trim())}><Plus size={15} className="mr-1" />Add category</Button></div>
        <div><label className={labelClass}>Employment type{required}</label><select className={inputClass} value={job.employmentType ?? "Full-time"} onChange={(e) => setField("employmentType", e.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Temporary</option><option>Apprenticeship</option></select></div>
        <div><label className={labelClass}>Location{required}</label><input className={inputClass} value={job.location ?? ""} onChange={(e) => setField("location", e.target.value)} maxLength={200} required placeholder="City, state or All India" /></div>
        <div><label className={labelClass}>Number of vacancies{required}</label><input type="number" min={1} className={inputClass} value={job.vacancies ?? 1} onChange={(e) => setField("vacancies", Number(e.target.value))} required /></div>
        <div><label className={labelClass}>Salary / pay scale</label><input className={inputClass} value={job.salaryText ?? ""} onChange={(e) => setField("salaryText", e.target.value)} maxLength={200} placeholder="e.g. ₹35,400–₹1,12,400 per month" /></div>
        <div><label className={labelClass}>Reference / notification number</label><input className={inputClass} value={job.referenceNumber ?? ""} onChange={(e) => setField("referenceNumber", e.target.value)} maxLength={100} placeholder="e.g. Advt. No. 04/2026" /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Eligibility and application</CardTitle><CardDescription>Requirements, dates and official links for candidates.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={labelClass}>Required qualification{required}</label><textarea className={areaClass} value={job.qualification ?? ""} onChange={(e) => setField("qualification", e.target.value)} required placeholder="Degrees, certifications or other required qualifications" /></div>
        <div><label className={labelClass}>Age limit</label><input className={inputClass} value={job.ageLimit ?? ""} onChange={(e) => setField("ageLimit", e.target.value)} maxLength={200} placeholder="e.g. 18–30 years; relaxations apply" /></div>
        <div><label className={labelClass}>Application start date</label><input type="date" className={inputClass} value={job.applicationStartDate?.slice(0, 10) ?? ""} onChange={(e) => setField("applicationStartDate", e.target.value || null)} /></div>
        <div><label className={labelClass}>Application deadline</label><input type="date" className={inputClass} value={job.applicationDeadline?.slice(0, 10) ?? ""} onChange={(e) => setField("applicationDeadline", e.target.value || null)} /></div>
        <div><label className={labelClass}>Application link</label><input type="url" className={inputClass} value={job.applicationUrl ?? ""} onChange={(e) => setField("applicationUrl", e.target.value)} placeholder="https://…" /></div>
        <div><label className={labelClass}>Official notification link</label><input type="url" className={inputClass} value={job.notificationUrl ?? ""} onChange={(e) => setField("notificationUrl", e.target.value)} placeholder="https://…" /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Job overview</CardTitle><CardDescription>Explain the opportunity and who should apply.</CardDescription></CardHeader><CardContent className="space-y-5">
        <div><label className={labelClass}>Description{required}</label><textarea className={areaClass} value={job.description ?? ""} onChange={(e) => setField("description", e.target.value)} required placeholder="Summarize the role and recruitment process." /></div>
        <div><label className={labelClass}>Responsibilities</label><textarea className={areaClass} value={job.responsibilities ?? ""} onChange={(e) => setField("responsibilities", e.target.value)} placeholder="Main duties, one per line" /></div>
        <div><label className={labelClass}>Additional eligibility details</label><textarea className={areaClass} value={job.eligibility ?? ""} onChange={(e) => setField("eligibility", e.target.value)} placeholder="Experience, nationality, physical standards or other conditions" /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Publishing</CardTitle><CardDescription>Drafts stay private. Published opportunities appear on the client home page.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div><label className={labelClass}>Status</label><select className={inputClass} value={job.status ?? "Draft"} onChange={(e) => setField("status", e.target.value as JobStatus)}><option value="Draft">Draft</option><option value="Published">Published</option><option value="Closed">Closed</option></select></div>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={!!job.isFeatured} onChange={(e) => setField("isFeatured", e.target.checked)} className="size-4 accent-primary" /><span><span className="flex items-center gap-1 text-sm font-medium"><Star size={14} />Feature on home page</span><span className="text-xs text-muted-foreground">Featured posts are shown first.</span></span></label>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Search engine appearance</CardTitle><CardDescription>Customize the readable job URL, page heading and search-result text. Leave title and description blank to use sensible defaults.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className={labelClass}>URL slug</label><div className="flex h-11 items-center rounded-lg border bg-background px-3"><span className="mr-1 shrink-0 text-xs text-muted-foreground">/jobs/</span><input className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" value={job.slug ?? ""} onChange={(e) => { setSlugEdited(true); setField("slug", normalizeSlugInput(e.target.value)); }} maxLength={220} placeholder={toSlug(job.title ?? "") || "job-title"} /></div><p className="mt-1 text-xs text-muted-foreground">Lowercase letters, numbers and hyphens. Existing links may change if you edit this.</p></div>
        <div><label className={labelClass}>Page title (visible heading)</label><input className={inputClass} value={job.pageTitle ?? ""} onChange={(e) => setField("pageTitle", e.target.value)} maxLength={200} placeholder={job.title || "Defaults to the job title"} /></div>
        <div><label className={labelClass}>Meta title</label><input className={inputClass} value={job.metaTitle ?? ""} onChange={(e) => setField("metaTitle", e.target.value)} maxLength={200} placeholder={`${job.pageTitle || job.title || "Job title"} | CrackGov`} /><p className="mt-1 text-xs text-muted-foreground">Shown in browser tabs and search results; aim for about 50–60 characters. {job.metaTitle?.length ?? 0}/200</p></div>
        <div className="sm:col-span-2"><label className={labelClass}>Meta description</label><textarea className={areaClass} value={job.metaDescription ?? ""} onChange={(e) => setField("metaDescription", e.target.value)} maxLength={320} placeholder="A concise summary for search results. Defaults to the job description." /><p className="mt-1 text-right text-xs text-muted-foreground">{job.metaDescription?.length ?? 0}/320 · Aim for about 150–160 characters.</p></div>
        <div className="sm:col-span-2"><label className={labelClass}>Meta keywords</label><input className={inputClass} value={job.metaKeywords ?? ""} onChange={(e) => setField("metaKeywords", e.target.value)} maxLength={500} placeholder="government vacancy, department recruitment, eligibility" /><p className="mt-1 text-xs text-muted-foreground">Separate keywords with commas.</p></div>
        <div className="sm:col-span-2 rounded-xl border bg-muted/30 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Search preview</p><p className="mt-2 truncate text-sm text-emerald-700 dark:text-emerald-400">crackgov/jobs/{job.slug || toSlug(job.title || "job-title") || "job-title"}</p><p className="mt-1 line-clamp-1 text-lg font-medium text-blue-700 dark:text-blue-400">{job.metaTitle || job.pageTitle || job.title || "Job title"} | CrackGov</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{job.metaDescription || job.description || "Job details and eligibility information will appear here."}</p></div>
      </CardContent></Card>
      <div className="flex justify-end gap-3 pb-8"><Button type="button" variant="outline" onClick={() => navigate("/jobs")}>Cancel</Button><Button type="submit" disabled={saveMutation.isPending || categoriesQuery.isLoading}>{saveMutation.isPending ? "Saving…" : editingId ? "Save changes" : "Create job post"}</Button></div>
    </form>}
  </div>;
}
