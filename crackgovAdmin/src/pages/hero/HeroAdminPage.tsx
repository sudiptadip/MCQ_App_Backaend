import type React from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Save, RefreshCw, Layout, Image as ImageIcon, BarChart3, ArrowRight, Zap, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { getAdminHeroSection, updateAdminHeroSection } from "../../features/hero/api";
import type { HeroSectionData } from "../../features/hero/types";
import { showToast } from "../../utils/toast";

export default function HeroAdminPage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["hero-section-admin"],
    queryFn: getAdminHeroSection,
  });

  const [formData, setFormData] = useState<HeroSectionData>({
    badgeText: "Prepare. Practice. Progress.",
    title: "Crack Government Exams & Unlock Your Dream Career",
    highlightTitle: "Dream Career",
    description: "Master competitive exams with topic-wise practice modules, instant score evaluation, daily current affairs, and real-time public sector job notifications.",
    primaryBtnText: "Start Free Practice",
    primaryBtnUrl: "/practice",
    secondaryBtnText: "Browse Govt Jobs",
    secondaryBtnUrl: "/jobs",
    stat1Value: "100+",
    stat1Label: "Exam Categories",
    stat2Value: "50,000+",
    stat2Label: "Practice MCQs",
    stat3Value: "Daily",
    stat3Label: "Current Affairs",
    stat4Value: "100% Free",
    stat4Label: "Verified Job Alerts",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop",
    imageTitle: "Structured Exam Mock Tests & Instant Analytics",
    badge1Text: "Live Exam Alerts",
    badge2Text: "Instant Performance Analysis",
  });

  useEffect(() => {
    if (query.data) {
      setFormData(query.data);
    }
  }, [query.data]);

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<HeroSectionData>) => updateAdminHeroSection(payload),
    onSuccess: () => {
      showToast.success("Hero section configuration saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["hero-section-admin"] });
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const handleChange = (field: keyof HeroSectionData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (query.isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
        Loading Hero Section settings...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Homepage Banner Content
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Hero Section Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage the hero banner titles, badges, stat counters, buttons, and graphics displayed on the client homepage.
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={updateMutation.isPending} className="shrink-0">
          <Save size={16} className="mr-2" />
          {updateMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Text & Badges */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
            <Layout className="w-4 h-4 text-primary" /> Main Hero Copy & Badges
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="badgeText">Top Pill Badge Text</Label>
              <Input
                id="badgeText"
                value={formData.badgeText || ""}
                onChange={(e) => handleChange("badgeText", e.target.value)}
                placeholder="e.g. Prepare. Practice. Progress."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="highlightTitle">Highlighted Words in Title</Label>
              <Input
                id="highlightTitle"
                value={formData.highlightTitle || ""}
                onChange={(e) => handleChange("highlightTitle", e.target.value)}
                placeholder="e.g. Dream Career"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Main Hero Headline</Label>
            <Input
              id="title"
              value={formData.title || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Crack Government Exams & Unlock Your Dream Career"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Hero Subtitle / Description</Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Provide a clear description for aspirants..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
            <ArrowRight className="w-4 h-4 text-primary" /> Call To Action Buttons
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 border rounded-xl bg-muted/20">
              <h4 className="text-xs font-bold uppercase text-primary">Primary Button</h4>
              <div className="space-y-1.5">
                <Label htmlFor="primaryBtnText">Button Label</Label>
                <Input
                  id="primaryBtnText"
                  value={formData.primaryBtnText || ""}
                  onChange={(e) => handleChange("primaryBtnText", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="primaryBtnUrl">Target Route / URL</Label>
                <Input
                  id="primaryBtnUrl"
                  value={formData.primaryBtnUrl || ""}
                  onChange={(e) => handleChange("primaryBtnUrl", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-xl bg-muted/20">
              <h4 className="text-xs font-bold uppercase text-primary">Secondary Button</h4>
              <div className="space-y-1.5">
                <Label htmlFor="secondaryBtnText">Button Label</Label>
                <Input
                  id="secondaryBtnText"
                  value={formData.secondaryBtnText || ""}
                  onChange={(e) => handleChange("secondaryBtnText", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secondaryBtnUrl">Target Route / URL</Label>
                <Input
                  id="secondaryBtnUrl"
                  value={formData.secondaryBtnUrl || ""}
                  onChange={(e) => handleChange("secondaryBtnUrl", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
            <BarChart3 className="w-4 h-4 text-primary" /> Highlight Stat Counters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="p-3 border rounded-xl space-y-2 bg-muted/10">
              <span className="text-xs font-bold text-muted-foreground">Stat #1</span>
              <div>
                <Label className="text-[11px]">Value</Label>
                <Input
                  value={formData.stat1Value || ""}
                  onChange={(e) => handleChange("stat1Value", e.target.value)}
                  placeholder="e.g. 100+"
                />
              </div>
              <div>
                <Label className="text-[11px]">Label</Label>
                <Input
                  value={formData.stat1Label || ""}
                  onChange={(e) => handleChange("stat1Label", e.target.value)}
                  placeholder="e.g. Exam Categories"
                />
              </div>
            </div>

            {/* Stat 2 */}
            <div className="p-3 border rounded-xl space-y-2 bg-muted/10">
              <span className="text-xs font-bold text-muted-foreground">Stat #2</span>
              <div>
                <Label className="text-[11px]">Value</Label>
                <Input
                  value={formData.stat2Value || ""}
                  onChange={(e) => handleChange("stat2Value", e.target.value)}
                  placeholder="e.g. 50,000+"
                />
              </div>
              <div>
                <Label className="text-[11px]">Label</Label>
                <Input
                  value={formData.stat2Label || ""}
                  onChange={(e) => handleChange("stat2Label", e.target.value)}
                  placeholder="e.g. Practice MCQs"
                />
              </div>
            </div>

            {/* Stat 3 */}
            <div className="p-3 border rounded-xl space-y-2 bg-muted/10">
              <span className="text-xs font-bold text-muted-foreground">Stat #3</span>
              <div>
                <Label className="text-[11px]">Value</Label>
                <Input
                  value={formData.stat3Value || ""}
                  onChange={(e) => handleChange("stat3Value", e.target.value)}
                  placeholder="e.g. Daily"
                />
              </div>
              <div>
                <Label className="text-[11px]">Label</Label>
                <Input
                  value={formData.stat3Label || ""}
                  onChange={(e) => handleChange("stat3Label", e.target.value)}
                  placeholder="e.g. Current Affairs"
                />
              </div>
            </div>

            {/* Stat 4 */}
            <div className="p-3 border rounded-xl space-y-2 bg-muted/10">
              <span className="text-xs font-bold text-muted-foreground">Stat #4</span>
              <div>
                <Label className="text-[11px]">Value</Label>
                <Input
                  value={formData.stat4Value || ""}
                  onChange={(e) => handleChange("stat4Value", e.target.value)}
                  placeholder="e.g. 100% Free"
                />
              </div>
              <div>
                <Label className="text-[11px]">Label</Label>
                <Input
                  value={formData.stat4Label || ""}
                  onChange={(e) => handleChange("stat4Label", e.target.value)}
                  placeholder="e.g. Verified Job Alerts"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Hero Graphic & Floating Badges */}
        <div className="rounded-2xl border bg-card p-6 space-y-4 shadow-2xs">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b pb-3">
            <ImageIcon className="w-4 h-4 text-primary" /> Right Graphic Showcase & Floating Badges
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="imageUrl">Banner / Graphic Image URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl || ""}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="imageTitle">Image Title / Overlay Caption</Label>
              <Input
                id="imageTitle"
                value={formData.imageTitle || ""}
                onChange={(e) => handleChange("imageTitle", e.target.value)}
                placeholder="e.g. Structured Exam Mock Tests & Instant Analytics"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5 p-3 border rounded-xl bg-muted/20">
                <Label htmlFor="badge1Text" className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Floating Badge 1 Text
                </Label>
                <Input
                  id="badge1Text"
                  value={formData.badge1Text || ""}
                  onChange={(e) => handleChange("badge1Text", e.target.value)}
                  placeholder="e.g. Live Exam Alerts"
                />
              </div>

              <div className="space-y-1.5 p-3 border rounded-xl bg-muted/20">
                <Label htmlFor="badge2Text" className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Floating Badge 2 Text
                </Label>
                <Input
                  id="badge2Text"
                  value={formData.badge2Text || ""}
                  onChange={(e) => handleChange("badge2Text", e.target.value)}
                  placeholder="e.g. Instant Performance Analysis"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={updateMutation.isPending} size="lg">
            <Save size={18} className="mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Hero Section"}
          </Button>
        </div>
      </form>
    </div>
  );
}
