import type { Metadata } from "next";
import { getPublicFaqs } from "@/features/faqs/api";
import type { FaqItem } from "@/types/faqs";
import { FaqSection } from "@/components/faqs/FaqSection";
import { Sparkles, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | CrackGov",
  description: "Find answers to common questions about government exam preparation, mock tests, study materials, job alerts, and custom practice on CrackGov.",
  alternates: { canonical: "/faqs" },
  openGraph: {
    type: "website",
    title: "CrackGov FAQs | Exam Preparation & Help Center",
    description: "Get instant answers to questions regarding government exam mock tests, notes, courses, and job notifications.",
    url: "/faqs",
  },
};

export default async function FaqPage() {
  let faqs: FaqItem[] = [];
  try {
    faqs = await getPublicFaqs();
  } catch {
    // FaqSection fallback will take over if API fails
  }

  return (
    <main className="flex-1">
      {/* Hero Header Banner */}
      <section className="relative border-b bg-gradient-to-br from-primary/10 via-background to-amber-500/10 py-14 sm:py-20 overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="container mx-auto px-4 text-center max-w-4xl relative">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-xs font-bold text-primary shadow-xs">
            <Sparkles size={14} /> Help Center & Support
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl text-foreground">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions about preparing with CrackGov? Find clear answers regarding mock tests, study materials, job alerts, and custom practice sessions below.
          </p>
        </div>
      </section>

      {/* Main FAQ Section */}
      <FaqSection initialFaqs={faqs} />
    </main>
  );
}
