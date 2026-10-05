import type { Metadata } from "next";
import { getPublicTestimonials } from "@/features/testimonials/api";
import type { TestimonialItem } from "@/types/testimonials";
import { TestimonialsSection } from "@/components/testimonials/TestimonialsSection";
import { Trophy, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Success Stories & Testimonials | CrackGov",
  description: "Read real reviews and success stories from aspirants who cracked SSC, Railway, Banking, and State Government exams using CrackGov.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    type: "website",
    title: "Student Testimonials | CrackGov Exam Preparation",
    description: "Discover how top-ranking students used CrackGov mock tests and study materials to achieve their dream government jobs.",
    url: "/testimonials",
  },
};

export default async function TestimonialsPage() {
  let testimonials: TestimonialItem[] = [];
  try {
    testimonials = await getPublicTestimonials();
  } catch {
    // TestimonialsSection fallback will handle display
  }

  return (
    <main className="flex-1">
      {/* Hero Banner */}
      <section className="relative border-b bg-gradient-to-br from-amber-500/10 via-background to-primary/10 py-14 sm:py-20 overflow-hidden">
        <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="container mx-auto px-4 text-center max-w-4xl relative">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-xs">
            <Trophy size={14} /> Proven Success & Reviews
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl text-foreground">
            Student Testimonials & Success Stories
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Thousands of aspirants rely on CrackGov for structured exam preparation. Here is what successful candidates have to say about their journey with us.
          </p>
        </div>
      </section>

      {/* Testimonials Card Section */}
      <TestimonialsSection initialTestimonials={testimonials} />
    </main>
  );
}
