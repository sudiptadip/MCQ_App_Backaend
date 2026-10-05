"use client";

import { useState } from "react";
import { Mail, Phone, Send, CheckCircle2, AlertCircle, Sparkles, MessageSquare } from "lucide-react";
import { submitContactForm } from "@/features/contact/api";

export function ContactSection() {
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!name.trim() || !contactInfo.trim() || !title.trim() || !description.trim()) {
      setStatusMessage({ type: "error", text: "Please fill out all fields." });
      return;
    }

    setLoading(true);

    try {
      const res = await submitContactForm({
        name,
        contactInfo,
        title,
        description,
      });

      setStatusMessage({ type: "success", text: res.message });
      setName("");
      setContactInfo("");
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Something went wrong. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border bg-card p-6 sm:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Contact Us
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                We're Here to Help You Succeed
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Have questions about exam preparation, practice modules, or job notifications? Send us a message and our support team will reach out to you directly.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Email Support</h4>
                  <p className="text-xs text-muted-foreground">Direct response for all academic & account queries.</p>
                  <a href="mailto:support@crackgov.com" className="text-xs font-semibold text-primary hover:underline">
                    support@crackgov.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Helpline & WhatsApp</h4>
                  <p className="text-xs text-muted-foreground">Available Mon - Sat, 9:00 AM - 7:00 PM</p>
                  <span className="text-xs font-semibold text-foreground">+91 98765 43210</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 bg-muted/20 border rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Send Us an Inquiry
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Enter your details below to save your inquiry directly to our database.
            </p>

            {statusMessage && (
              <div
                className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium ${
                  statusMessage.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="text-xs font-bold text-foreground">
                    Full Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-info" className="text-xs font-bold text-foreground">
                    Phone or Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="contact-info"
                    type="text"
                    required
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="e.g. rahul@gmail.com or 9876543210"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-title" className="text-xs font-bold text-foreground">
                  Inquiry Title / Subject <span className="text-destructive">*</span>
                </label>
                <input
                  id="contact-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inquiry about SSC CGL Mock Test Series"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-description" className="text-xs font-bold text-foreground">
                  Description / Message <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="contact-description"
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed description of your question or issue..."
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
