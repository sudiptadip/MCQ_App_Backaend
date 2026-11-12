import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Save,
  Sparkles,
  Code2,
  Eye,
  FileCode,
  Plus
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { getEmailTemplateById, saveEmailTemplate } from "../../features/email-templates/api";
import type { EmailTemplateItem } from "../../features/email-templates/types";
import { showToast } from "../../utils/toast";

// Standard preset template keys for quick selection
const PRESET_TEMPLATE_KEYS = [
  { key: "otp-email-template", label: "OTP Verification Email", vars: "{{otp}}, {{student_name}}, {{franchise_name}}, {{expiry_minutes}}" },
  { key: "invoice-email-template", label: "Fee Payment Invoice Email", vars: "{{invoice_no}}, {{payment_date}}, {{student_name}}, {{student_id}}, {{fee_structure_name}}, {{amount_paid}}, {{payment_mode}}, {{transaction_ref}}, {{franchise_name}}" },
  { key: "welcome-email-template", label: "Student Welcome Email", vars: "{{student_name}}, {{franchise_name}}, {{email}}, {{login_url}}" },
  { key: "password-reset-template", label: "Password Reset Request Email", vars: "{{student_name}}, {{reset_link}}, {{expiry_hours}}, {{franchise_name}}" },
  { key: "exam-reminder-template", label: "Upcoming Exam Notification Email", vars: "{{student_name}}, {{test_title}}, {{test_date}}, {{test_duration}}, {{franchise_name}}" },
];

export default function UpsertEmailTemplatePage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  // Form State
  const [formData, setFormData] = useState<Partial<EmailTemplateItem>>({
    templateKey: "otp-email-template",
    name: "",
    subject: "",
    bodyHtml: "",
    bodyText: "",
    dynamicVariables: "{{otp}}, {{student_name}}, {{franchise_name}}, {{expiry_minutes}}",
    franchiseId: null,
    isActive: true,
  });

  const [activeFocusField, setActiveFocusField] = useState<"subject" | "bodyHtml">("bodyHtml");

  // Fetch existing template if edit mode
  const { data: existingData, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["emailTemplate", id],
    queryFn: () => getEmailTemplateById(Number(id)),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingData) {
      setFormData({
        id: existingData.id,
        templateKey: existingData.templateKey || "",
        name: existingData.name || "",
        subject: existingData.subject || "",
        bodyHtml: existingData.bodyHtml || "",
        bodyText: existingData.bodyText || "",
        dynamicVariables: existingData.dynamicVariables || "",
        franchiseId: existingData.franchiseId ?? null,
        isActive: existingData.isActive ?? true,
      });
    }
  }, [existingData]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: saveEmailTemplate,
    onSuccess: () => {
      showToast.success(`Email template ${isEditMode ? "updated" : "created"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      navigate("/email-templates");
    },
    onError: (error: Error) => showToast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateKey?.trim()) {
      showToast.error("Template Key is required");
      return;
    }
    if (!formData.name?.trim()) {
      showToast.error("Template Name is required");
      return;
    }
    if (!formData.subject?.trim()) {
      showToast.error("Email Subject is required");
      return;
    }
    if (!formData.bodyHtml?.trim()) {
      showToast.error("Body HTML is required");
      return;
    }

    saveMutation.mutate(formData);
  };

  // Helper to insert dynamic variable tag into Subject or Body HTML
  const insertVariableTag = (tag: string) => {
    if (activeFocusField === "subject") {
      setFormData((prev) => ({
        ...prev,
        subject: (prev.subject || "") + " " + tag,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        bodyHtml: (prev.bodyHtml || "") + " " + tag,
      }));
    }
    showToast.success(`Inserted ${tag} into ${activeFocusField === "subject" ? "Subject" : "Body HTML"}`);
  };

  // Handle Preset Key Select
  const handleSelectPreset = (presetKey: string) => {
    const found = PRESET_TEMPLATE_KEYS.find((p) => p.key === presetKey);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        templateKey: found.key,
        name: prev.name || found.label,
        dynamicVariables: found.vars,
      }));
    } else {
      setFormData((prev) => ({ ...prev, templateKey: presetKey }));
    }
  };

  // Extract variables array
  const availableVarsList =
    formData.dynamicVariables
      ?.split(",")
      .map((v) => v.trim())
      .filter(Boolean) || [];

  if (isEditMode && isLoadingExisting) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground animate-pulse">Loading email template...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate("/email-templates")}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Mail className="text-primary" size={22} />
              {isEditMode ? "Edit Email Template" : "Create New Email Template"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure dynamic email layouts, subjects, and SQL placeholders.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/email-templates")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
            <Save size={15} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scope and Identification Card */}
        <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Code2 size={16} className="text-primary" />
            Template Identification & Scope
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preset / Template Key */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Template Key / Identifier <span className="text-destructive">*</span>
              </label>
              <div className="space-y-1.5">
                <select
                  className="w-full h-9 px-3 text-xs rounded-md border bg-background font-mono font-semibold"
                  value={PRESET_TEMPLATE_KEYS.some((p) => p.key === formData.templateKey) ? formData.templateKey : "custom"}
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      handleSelectPreset(e.target.value);
                    }
                  }}
                >
                  <optgroup label="Standard Built-in Preset Templates">
                    {PRESET_TEMPLATE_KEYS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.key} ({p.label})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">Custom Template Key...</option>
                </select>
                <input
                  type="text"
                  className="w-full h-9 px-3 text-xs font-mono rounded-md border bg-background"
                  placeholder="e.g. otp-email-template"
                  value={formData.templateKey || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, templateKey: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Template Friendly Name */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Template Display Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="w-full h-9 px-3 text-xs rounded-md border bg-background"
                placeholder="e.g. OTP Verification Email"
                value={formData.name || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {/* Active Status Toggle */}
            <div className="flex items-center gap-3 pt-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-xs font-semibold">
                {formData.isActive ? "Template Active" : "Template Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Placeholders Helper Bar */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles size={15} />
              Dynamic SQL Variables & Placeholders
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Click any variable to insert into active input ({activeFocusField === "subject" ? "Subject" : "HTML Body"})
            </span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Comma-Separated Dynamic Variables List:
            </label>
            <input
              type="text"
              className="w-full h-8 px-2.5 text-xs font-mono rounded border bg-background"
              value={formData.dynamicVariables || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, dynamicVariables: e.target.value }))}
              placeholder="{{otp}}, {{student_name}}, {{franchise_name}}"
            />
          </div>

          {/* Variable Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {availableVarsList.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => insertVariableTag(tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-background border border-primary/30 text-xs font-mono font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
              >
                <Plus size={12} />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Input */}
        <div className="bg-card border rounded-xl p-5 space-y-2 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Email Subject Line <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className="w-full h-10 px-3 text-sm font-semibold rounded-md border bg-background"
            placeholder="e.g. Your OTP for {{franchise_name}} Login is {{otp}}"
            value={formData.subject || ""}
            onFocus={() => setActiveFocusField("subject")}
            onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Supports dynamic replacement tags like <code className="font-mono text-primary">{`{{otp}}`}</code> or <code className="font-mono text-primary">{`{{student_name}}`}</code>.
          </p>
        </div>

        {/* HTML Body Editor & Live Preview Tabs */}
        <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCode size={16} className="text-primary" />
              Email Body HTML & Content
            </h2>

            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === "edit"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code2 size={13} className="inline mr-1" />
                HTML Source Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === "preview"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye size={13} className="inline mr-1" />
                Live Visual Preview
              </button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <div className="space-y-3">
              <textarea
                className="w-full min-h-[22rem] p-3 text-xs font-mono leading-relaxed rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.bodyHtml || ""}
                onFocus={() => setActiveFocusField("bodyHtml")}
                onChange={(e) => setFormData((prev) => ({ ...prev, bodyHtml: e.target.value }))}
                placeholder="<div style='font-family: Arial;'><h2>Hello {{student_name}}</h2>...</div>"
                required
              />
            </div>
          ) : (
            <div className="border rounded-lg p-6 bg-white text-black min-h-[22rem] overflow-x-auto shadow-inner">
              <div
                dangerouslySetInnerHTML={{
                  __html: formData.bodyHtml || "<p style='color:#999;'>No HTML content entered yet.</p>",
                }}
              />
            </div>
          )}

          {/* Plain Text Body (Optional) */}
          <div className="pt-2 border-t">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Plain Text Alternative Body (Optional)
            </label>
            <textarea
              className="w-full min-h-[5rem] p-2.5 text-xs font-mono rounded-md border bg-background"
              value={formData.bodyText || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, bodyText: e.target.value }))}
              placeholder="Dear {{student_name}}, your OTP code for {{franchise_name}} is {{otp}}."
            />
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate("/email-templates")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save size={15} className="mr-1.5" />
            {saveMutation.isPending ? "Saving..." : "Save Email Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}
