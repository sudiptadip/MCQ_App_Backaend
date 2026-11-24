"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Landmark,
  Scale,
  Shield,
  Sparkles,
  Train,
} from "lucide-react";
import type { PublicExamCategoryItem } from "@/types/exam-categories";

export const DEFAULT_EXAM_CATEGORIES: PublicExamCategoryItem[] = [
  {
    id: 1,
    title: "SSC Exams",
    description: "CGL, CHSL, MTS, CPO, GD Constable & Steno",
    href: "/practice",
    iconName: "Briefcase",
    accentColor: "from-blue-600 to-indigo-700",
    displayOrder: 1,
  },
  {
    id: 2,
    title: "Banking & Insurance",
    description: "IBPS PO/Clerk, SBI PO/Clerk, RBI Grade B, LIC",
    href: "/practice",
    iconName: "Landmark",
    accentColor: "from-emerald-600 to-teal-700",
    displayOrder: 2,
  },
  {
    id: 3,
    title: "Railways (RRB)",
    description: "NTPC, Group D, ALP, Technician, JE & RPF",
    href: "/practice",
    iconName: "Train",
    accentColor: "from-amber-600 to-orange-700",
    displayOrder: 3,
  },
  {
    id: 4,
    title: "Civil Services & State PSC",
    description: "UPSC CSE, State PSCs (BPSC, WBPSC, UPPSC, MPSC)",
    href: "/practice",
    iconName: "GraduationCap",
    accentColor: "from-purple-600 to-violet-800",
    displayOrder: 4,
  },
  {
    id: 5,
    title: "Defence & Police",
    description: "NDA, CDS, AFCAT, CAPF, Delhi Police & State SI",
    href: "/practice",
    iconName: "Shield",
    accentColor: "from-rose-600 to-red-800",
    displayOrder: 5,
  },
  {
    id: 6,
    title: "Teaching Exams",
    description: "CTET, State TETs, KVS, NVS, DSSSB & UGC NET",
    href: "/practice",
    iconName: "BookOpen",
    accentColor: "from-cyan-600 to-sky-800",
    displayOrder: 6,
  },
];

function getCategoryIcon(name?: string) {
  const key = name?.toLowerCase().trim() || "";
  if (key.includes("train") || key.includes("railway") || key.includes("rrb")) return Train;
  if (key.includes("landmark") || key.includes("bank")) return Landmark;
  if (key.includes("shield") || key.includes("defence") || key.includes("police")) return Shield;
  if (key.includes("graduation") || key.includes("upsc") || key.includes("civil")) return GraduationCap;
  if (key.includes("book") || key.includes("teach") || key.includes("tet")) return BookOpen;
  if (key.includes("building") || key.includes("psu") || key.includes("engineer")) return Building2;
  if (key.includes("scale") || key.includes("law") || key.includes("court")) return Scale;
  return Briefcase;
}

interface ExamCategoriesSectionProps {
  initialCategories?: PublicExamCategoryItem[];
}

export function ExamCategoriesSection({ initialCategories }: ExamCategoriesSectionProps) {
  const categories =
    initialCategories && initialCategories.length > 0
      ? initialCategories
      : DEFAULT_EXAM_CATEGORIES;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles size={14} /> Targeted Preparation
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Explore Exam Categories
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Choose your goal to find tailored mock tests, syllabus-aligned practice sets, and latest job notifications.
          </p>
        </div>
        <Link
          href="/practice"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          View all categories <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = getCategoryIcon(category.iconName);
          return (
            <Link
              key={category.id}
              href={category.href || "/practice"}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.title}
                    className="size-12 shrink-0 rounded-xl object-cover border"
                  />
                ) : (
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground transition-colors group-hover:text-primary">
                    {category.title}
                  </h3>
                  {category.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border/50 pt-3 text-xs font-semibold text-muted-foreground group-hover:text-primary">
                <span>Start practicing</span>
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
