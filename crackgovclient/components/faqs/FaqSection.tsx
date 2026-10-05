"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles, MessageSquare } from "lucide-react";
import type { FaqItem } from "@/types/faqs";

interface FaqSectionProps {
  initialFaqs?: FaqItem[];
}

export function FaqSection({ initialFaqs = [] }: FaqSectionProps) {
  const faqs = initialFaqs;
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const categories = ["All", ...Array.from(new Set(faqs.map((f) => f.category || "General")))];

  const filteredFaqs = selectedCategory === "All" 
    ? faqs 
    : faqs.filter((f) => (f.category || "General").toLowerCase() === selectedCategory.toLowerCase());

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="w-3.5 h-3.5" /> Got Questions?
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Everything you need to know about preparing for exams, tracking job alerts, and using CrackGov features.
        </p>
      </div>

      {/* Category Filter Tabs */}
      {categories.length > 2 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setOpenIndex(0);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Accordion Grid */}
      <div className="max-w-4xl mx-auto space-y-4">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id || idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-card ${
                isOpen ? "border-primary/40 shadow-sm" : "hover:border-border/80"
              }`}
            >
              <button
                onClick={() => toggleAccordion(idx)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-foreground hover:text-primary transition-colors gap-4"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                    isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <span className="text-base sm:text-lg font-bold">{faq.question}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm sm:text-base leading-relaxed text-muted-foreground border-t border-border/40 animate-in fade-in duration-150">
                  <div className="pl-11 pr-2 whitespace-pre-line">{faq.answer}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Support CTA */}
      <div className="mt-12 text-center bg-muted/40 border rounded-2xl p-6 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">Have more questions?</h4>
            <p className="text-xs text-muted-foreground">Reach out to our academic support team anytime.</p>
          </div>
        </div>
        <a
          href="mailto:support@crackgov.com"
          className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          Contact Support
        </a>
      </div>
    </section>
  );
}
