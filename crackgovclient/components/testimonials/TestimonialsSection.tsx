"use client";

import { Star, Quote, Award, Trophy } from "lucide-react";
import type { TestimonialItem } from "@/types/testimonials";

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 1,
    studentName: "Ananya Sharma",
    examName: "SSC CGL 2025",
    rankOrScore: "AIR 42 - Inspector",
    content: "CrackGov mock tests and daily practice quizzes were instrumental in my preparation. The instant detailed explanations for every question helped me identify weak areas quickly.",
    rating: 5,
    displayOrder: 1,
  },
  {
    id: 2,
    studentName: "Rajesh Kumar",
    examName: "RRB NTPC 2025",
    rankOrScore: "Score: 94/100",
    content: "The daily current affairs section on CrackGov is top-notch. It saved me hours of daily news scanning and gave me exam-relevant facts directly.",
    rating: 5,
    displayOrder: 2,
  },
  {
    id: 3,
    studentName: "Priya Verma",
    examName: "IBPS PO 2025",
    rankOrScore: "Selected - SBI PO",
    content: "The custom practice module enabled me to target specific topics where I was lagging behind. The UI is super smooth and easy to practice on mobile.",
    rating: 5,
    displayOrder: 3,
  },
];

interface TestimonialsSectionProps {
  initialTestimonials?: TestimonialItem[];
}

export function TestimonialsSection({ initialTestimonials }: TestimonialsSectionProps) {
  const testimonials =
    initialTestimonials && initialTestimonials.length > 0
      ? initialTestimonials
      : DEFAULT_TESTIMONIALS;

  return (
    <section className="border-t bg-gradient-to-b from-background via-muted/20 to-background py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-amber-500/10 border-amber-500/30 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <Trophy className="w-3.5 h-3.5" /> Student Success Stories
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Trusted by Government Exam Aspirants
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Hear from students who prepared with CrackGov and achieved top ranks in competitive examinations.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => {
            const initials = item.studentName
              ? item.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "S";

            return (
              <div
                key={item.id}
                className="relative flex flex-col justify-between rounded-2xl border bg-card p-6 shadow-xs hover:shadow-md transition-shadow duration-200"
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-muted-foreground/15 pointer-events-none" />

                <div className="space-y-4">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4"
                        fill={i < (item.rating || 5) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>

                  {/* Quote Content */}
                  <p className="text-sm sm:text-base leading-relaxed text-foreground/90 italic">
                    "{item.content}"
                  </p>
                </div>

                {/* Author Info */}
                <div className="mt-6 pt-4 border-t flex items-center gap-3">
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.studentName}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-sm text-foreground truncate">{item.studentName}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate mt-0.5">
                      {item.examName && <span className="font-medium text-primary">{item.examName}</span>}
                      {item.rankOrScore && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-accent px-2 py-0.5 rounded-md text-foreground">
                          <Award className="w-3 h-3 text-amber-500" />
                          {item.rankOrScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
