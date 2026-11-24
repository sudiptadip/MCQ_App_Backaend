import Link from "next/link";
import { ArrowRight, BookOpenCheck, BriefcaseBusiness, GraduationCap, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getPublicJobs } from "@/features/jobs/api";
import type { Metadata } from "next";
import type { JobPost } from "@/types/jobs";
import { getPublicBlogs } from "@/features/blogs/api";
import type { BlogPost } from "@/types/blogs";
import { getPublicCurrentAffairs } from "@/features/current-affairs/api";
import type { DailyCurrentAffair } from "@/types/current-affairs";
import { getPublicFaqs } from "@/features/faqs/api";
import type { FaqItem } from "@/types/faqs";
import { getPublicTestimonials } from "@/features/testimonials/api";
import type { TestimonialItem } from "@/types/testimonials";
import { getPublicExamCategories } from "@/features/exam-categories/api";
import type { PublicExamCategoryItem } from "@/types/exam-categories";
import { HomeSections } from "@/components/home/HomeSections";

export const metadata: Metadata = {
  title: "Government Jobs, Exam Preparation & Study Resources",
  description: "Find current government job notifications, eligibility details and application deadlines while preparing with practice tests and study resources on CrackGov.",
  keywords: ["latest government jobs", "government job notifications", "government exam practice", "competitive exam preparation", "mock tests", "study resources"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "CrackGov | Government Jobs & Exam Preparation",
    description: "Discover government job openings and prepare with focused exam practice and study resources.",
    url: "/",
  },
  twitter: { card: "summary", title: "CrackGov | Government Jobs & Exam Preparation", description: "Discover job openings and prepare for government exams with CrackGov." },
};

export default async function Home() {
  let examCategories: PublicExamCategoryItem[] = [];
  let jobs: JobPost[] = [];
  let blogs: BlogPost[] = [];
  let currentAffairs: DailyCurrentAffair[] = [];
  let faqs: FaqItem[] = [];
  let testimonials: TestimonialItem[] = [];

  try {
    examCategories = (await getPublicExamCategories()) ?? [];
  } catch (error) {
    console.error("SSR Exam Categories fetch error:", error);
  }

  try {
    const result = await getPublicJobs({ page: 1, pageSize: 3 });
    jobs = result?.items ?? [];
  } catch (error) {
    console.error("SSR Jobs fetch error:", error);
  }

  try {
    const result = await getPublicBlogs({ page: 1, pageSize: 3 });
    blogs = result?.items ?? [];
  } catch (error) {
    console.error("SSR Blogs fetch error:", error);
  }

  try {
    const result = await getPublicCurrentAffairs({ page: 1, pageSize: 3 });
    currentAffairs = result?.items ?? [];
  } catch (error) {
    console.error("SSR Current Affairs fetch error:", error);
  }

  try {
    faqs = (await getPublicFaqs()) ?? [];
  } catch (error) {
    console.error("SSR FAQs fetch error:", error);
  }

  try {
    testimonials = (await getPublicTestimonials()) ?? [];
  } catch (error) {
    console.error("SSR Testimonials fetch error:", error);
  }

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-sky-500/10">
        <div className="pointer-events-none absolute -right-24 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_0.8fr] md:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={14} />Prepare. Practice. Progress.
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
              Your next opportunity starts with <span className="text-primary">CrackGov</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Prepare for government exams with focused practice and study resources, then discover current public-sector job openings in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/practice" className={buttonVariants({ size: "lg" })}>
                Start practicing <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link href="/jobs" className={buttonVariants({ size: "lg", variant: "outline" })}>
                <BriefcaseBusiness className="mr-2 size-4" />Explore jobs
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <BookOpenCheck className="size-7 text-primary" />
              <h2 className="mt-5 font-bold">Structured practice</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Build confidence with topic-based questions and mock tests.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
              <GraduationCap className="size-7 text-primary" />
              <h2 className="mt-5 font-bold">Study resources</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Keep your preparation organized with notes and lessons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Home Sections (Exam Categories, Jobs, Current Affairs, Blogs, Testimonials, Contact, FAQs) */}
      <HomeSections
        initialExamCategories={examCategories}
        initialJobs={jobs}
        initialBlogs={blogs}
        initialCurrentAffairs={currentAffairs}
        initialFaqs={faqs}
        initialTestimonials={testimonials}
      />

      <section className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            { title: "Focused preparation", description: "Practice by topic and keep track of your progress." },
            { title: "Useful resources", description: "Find notes, videos and materials that support your study plan." },
            { title: "Real opportunities", description: "Browse active job listings and follow official application links." },
          ].map((item) => (
            <div key={item.title}>
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
