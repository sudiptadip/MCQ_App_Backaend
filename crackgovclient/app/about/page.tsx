import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Target,
  Compass,
  BookOpenCheck,
  BriefcaseBusiness,
  GraduationCap,
  Newspaper,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us | CrackGov",
  description:
    "Learn about CrackGov, India's dedicated preparation portal for government exam aspirants. Discover our mission, vision, practice modules, study resources, and job alert platform.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: "About CrackGov | Government Exam Preparation & Career Board",
    description:
      "CrackGov empowers aspirants with topic-wise practice, verified study notes, daily current affairs, and real-time public sector job notifications.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <main className="flex-1">
      {/* Hero Banner */}
      <section className="relative border-b bg-gradient-to-br from-primary/10 via-background to-sky-500/10 py-16 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="container mx-auto px-4 text-center max-w-4xl relative">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-xs font-bold text-primary shadow-xs">
            <Sparkles size={14} /> Empowering Aspirants Across India
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-6xl text-foreground">
            About <span className="text-primary">CrackGov</span>
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            CrackGov is a modern, student-centric platform designed to simplify government exam preparation while keeping aspirants informed about real public-sector career opportunities.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="rounded-3xl border bg-card p-8 shadow-xs relative overflow-hidden">
            <div className="p-3.5 rounded-2xl bg-primary/10 text-primary inline-block mb-4">
              <Target className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              To provide every student with structured, high-quality practice tools, curated study notes, and reliable job notifications, ensuring that geographical or financial barriers never limit career success.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-3xl border bg-card p-8 shadow-xs relative overflow-hidden">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 inline-block mb-4">
              <Compass className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Our Vision</h2>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              To build India’s most trusted and accessible ecosystem for competitive exam preparation, helping millions of dedicated candidates crack Central & State Government examinations.
            </p>
          </div>
        </div>
      </section>

      {/* Core Ecosystem / Features */}
      <section className="border-t bg-muted/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              All-In-One Platform
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              What We Offer
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Explore the core components designed to accelerate your preparation journey.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                <BookOpenCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Structured Practice</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Topic-wise practice questions, custom test creation, and full-length mock exams.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                <BriefcaseBusiness className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Government Job Alerts</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real-time updates on active job notifications, eligibility, deadlines, and official links.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Daily Current Affairs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Curated daily revision digests tailored specifically for competitive examination standards.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 space-y-3 shadow-xs">
              <div className="p-3 rounded-xl bg-primary/10 text-primary w-fit">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Notes & Video Classes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Downloadable PDF notes and video lessons to build conceptual clarity in key subjects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose CrackGov */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Why CrackGov
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              Designed for Speed, Accuracy, and Results
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              We focus on providing clean, distraction-free preparation tools so you can concentrate on what matters most—mastering your syllabus and cracking exams.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Expertly Curated Content</h4>
                  <p className="text-xs text-muted-foreground">
                    Questions and study resources structured strictly according to official exam patterns.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Mobile & Tablet Friendly</h4>
                  <p className="text-xs text-muted-foreground">
                    Seamless responsive interface allowing you to practice anytime, anywhere.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-foreground">Transparent Job Information</h4>
                  <p className="text-xs text-muted-foreground">
                    Direct access to official notification PDFs and genuine application portals.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats / Cards Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl border bg-card shadow-xs text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-primary mx-auto" />
              <h3 className="text-2xl font-black text-foreground">100%</h3>
              <p className="text-xs text-muted-foreground font-semibold">Verified Notifications</p>
            </div>

            <div className="p-6 rounded-3xl border bg-card shadow-xs text-center space-y-2">
              <Zap className="w-8 h-8 text-amber-500 mx-auto" />
              <h3 className="text-2xl font-black text-foreground">Instant</h3>
              <p className="text-xs text-muted-foreground font-semibold">Test Evaluation</p>
            </div>

            <div className="p-6 rounded-3xl border bg-card shadow-xs text-center space-y-2 col-span-2">
              <Users className="w-8 h-8 text-sky-500 mx-auto" />
              <h3 className="text-2xl font-black text-foreground">Thousands</h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Of Aspirants Practicing Daily Across India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-8 sm:p-14 shadow-xl text-center">
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 size-80 rounded-full bg-amber-500/15 blur-3xl" />

          <div className="relative max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> Start Your Journey Today
            </span>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
              Ready to Take Your Preparation to the Next Level?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Join CrackGov today, practice with high-yield questions, stay updated on daily current affairs, and land your dream government job.
            </p>

            {/* Quick Value Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-300 pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Free Practice Tests
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified Job Alerts
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Daily Current Affairs
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/practice"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer"
              >
                <span>Start Practicing Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800/90 border border-slate-700 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-700/80 hover:text-white transition-all cursor-pointer"
              >
                <BriefcaseBusiness className="w-4 h-4 text-amber-400" />
                <span>Explore Job Openings</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
