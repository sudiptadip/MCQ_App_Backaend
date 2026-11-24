"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { CurrentAffairsCard } from "@/components/current-affairs/CurrentAffairsCard";
import { BlogCard } from "@/components/blogs/BlogCard";
import { TestimonialsSection } from "@/components/testimonials/TestimonialsSection";
import { ContactSection } from "@/components/contact/ContactSection";
import { FaqSection } from "@/components/faqs/FaqSection";
import { ExamCategoriesSection } from "@/components/exam-categories/ExamCategoriesSection";
import { getPublicJobs } from "@/features/jobs/api";
import { getPublicBlogs } from "@/features/blogs/api";
import { getPublicCurrentAffairs } from "@/features/current-affairs/api";
import { getPublicFaqs } from "@/features/faqs/api";
import { getPublicTestimonials } from "@/features/testimonials/api";
import { getPublicExamCategories } from "@/features/exam-categories/api";
import type { JobPost } from "@/types/jobs";
import type { BlogPost } from "@/types/blogs";
import type { DailyCurrentAffair } from "@/types/current-affairs";
import type { FaqItem } from "@/types/faqs";
import type { TestimonialItem } from "@/types/testimonials";
import type { PublicExamCategoryItem } from "@/types/exam-categories";

interface HomeSectionsProps {
  initialExamCategories?: PublicExamCategoryItem[];
  initialJobs: JobPost[];
  initialBlogs: BlogPost[];
  initialCurrentAffairs: DailyCurrentAffair[];
  initialFaqs: FaqItem[];
  initialTestimonials: TestimonialItem[];
}

export function HomeSections({
  initialExamCategories,
  initialJobs,
  initialBlogs,
  initialCurrentAffairs,
  initialFaqs,
  initialTestimonials,
}: HomeSectionsProps) {
  const [examCategories, setExamCategories] = useState<PublicExamCategoryItem[]>(initialExamCategories ?? []);
  const [jobs, setJobs] = useState<JobPost[]>(initialJobs ?? []);
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs ?? []);
  const [currentAffairs, setCurrentAffairs] = useState<DailyCurrentAffair[]>(initialCurrentAffairs ?? []);
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs ?? []);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(initialTestimonials ?? []);

  useEffect(() => {
    let active = true;

    // Client-side fallback: If SSR returned empty data, fetch from the client browser
    if (!initialExamCategories || initialExamCategories.length === 0) {
      getPublicExamCategories()
        .then((res) => {
          if (active && res && res.length > 0) {
            setExamCategories(res);
          }
        })
        .catch(() => {});
    }

    if (!initialJobs || initialJobs.length === 0) {
      getPublicJobs({ page: 1, pageSize: 3 })
        .then((res) => {
          if (active && res?.items && res.items.length > 0) {
            setJobs(res.items);
          }
        })
        .catch(() => {});
    }

    if (!initialCurrentAffairs || initialCurrentAffairs.length === 0) {
      getPublicCurrentAffairs({ page: 1, pageSize: 3 })
        .then((res) => {
          if (active && res?.items && res.items.length > 0) {
            setCurrentAffairs(res.items);
          }
        })
        .catch(() => {});
    }

    if (!initialBlogs || initialBlogs.length === 0) {
      getPublicBlogs({ page: 1, pageSize: 3 })
        .then((res) => {
          if (active && res?.items && res.items.length > 0) {
            setBlogs(res.items);
          }
        })
        .catch(() => {});
    }

    if (!initialFaqs || initialFaqs.length === 0) {
      getPublicFaqs()
        .then((res) => {
          if (active && res && res.length > 0) {
            setFaqs(res);
          }
        })
        .catch(() => {});
    }

    if (!initialTestimonials || initialTestimonials.length === 0) {
      getPublicTestimonials()
        .then((res) => {
          if (active && res && res.length > 0) {
            setTestimonials(res);
          }
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [initialExamCategories, initialJobs, initialCurrentAffairs, initialBlogs, initialFaqs, initialTestimonials]);

  return (
    <>
      {/* Exam Categories Section */}
      <ExamCategoriesSection initialCategories={examCategories} />

      {/* Latest government jobs */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Career board</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Latest government jobs</h2>
            <p className="mt-2 text-muted-foreground">Fresh openings, clear deadlines and direct links to official notices.</p>
          </div>
          <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Browse all jobs <ArrowRight size={16} />
          </Link>
        </div>
        {jobs.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center">
            <BriefcaseBusiness className="mx-auto size-8 text-primary" />
            <h3 className="mt-3 font-bold">New opportunities are on the way</h3>
            <p className="mt-1 text-sm text-muted-foreground">Visit the jobs board again soon to see current openings.</p>
          </div>
        )}
      </section>

      {/* Current Affairs */}
      {currentAffairs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Daily revision</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Current affairs</h2>
              <p className="mt-2 text-muted-foreground">Recent updates with exam relevance and source links.</p>
            </div>
            <Link href="/current-affairs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              View all updates <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {currentAffairs.map((item) => (
              <CurrentAffairsCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Blogs / Journal */}
      {blogs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">CrackGov journal</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Guides and updates</h2>
              <p className="mt-2 text-muted-foreground">Practical explainers for your exam and career journey.</p>
            </div>
            <Link href="/blogs" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Visit the blog <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        </section>
      )}

      {/* Student Success Stories & Testimonials */}
      <TestimonialsSection initialTestimonials={testimonials} />

      {/* Contact Us Section */}
      <ContactSection />

      {/* Interactive FAQ Section */}
      <FaqSection initialFaqs={faqs} />
    </>
  );
}
