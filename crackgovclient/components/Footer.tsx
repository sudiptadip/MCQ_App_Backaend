import Link from "next/link";
import { Mail, Phone, Sparkles, BookOpen, Briefcase, GraduationCap, ArrowRight } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-900 text-slate-200 dark:bg-slate-950 dark:text-slate-300 transition-colors">
      {/* Top Banner CTA */}
      <div className="border-b border-slate-800 bg-slate-900/60 py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Start Your Exam Preparation Today
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Access free practice modules, daily current affairs, notes, and official job alerts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
            >
              Start Practice <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              Explore Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <img
                src="/logo.png"
                alt="CrackGov Logo"
                className="h-9 w-auto object-contain dark:invert filter invert"
              />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              CrackGov is India's dedicated preparation portal for government job aspirants. Practice structured mock tests, access top study notes, and track real-time public sector job notifications.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href="mailto:support@crackgov.com" className="hover:text-white transition-colors">
                  support@crackgov.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+91 98765 43210 (Mon - Sat, 9 AM - 7 PM)</span>
              </div>
            </div>
          </div>

          {/* Column 1: Help & Support */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">
              Help & Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/faqs" className="hover:text-amber-400 transition-colors">
                  Frequently Asked Questions (FAQ)
                </Link>
              </li>
              <li>
                <Link href="/testimonials" className="hover:text-amber-400 transition-colors">
                  Student Success Stories
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-400 transition-colors">
                  About CrackGov
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Preparation */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">
              Practice & Study
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/practice" className="hover:text-amber-400 transition-colors">
                  Practice Modules
                </Link>
              </li>
              <li>
                <Link href="/practice/custom" className="hover:text-amber-400 transition-colors">
                  Custom Practice Tests
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-amber-400 transition-colors">
                  Courses & Classes
                </Link>
              </li>
              <li>
                <Link href="/notes" className="hover:text-amber-400 transition-colors">
                  Notes & Study PDFs
                </Link>
              </li>
              <li>
                <Link href="/videos" className="hover:text-amber-400 transition-colors">
                  Video Classes
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Jobs & Updates */}
          <div>
            <h4 className="text-sm font-bold text-white tracking-wider uppercase mb-4">
              Jobs & Updates
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/jobs" className="hover:text-amber-400 transition-colors">
                  Latest Government Jobs
                </Link>
              </li>
              <li>
                <Link href="/current-affairs" className="hover:text-amber-400 transition-colors">
                  Daily Current Affairs
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="hover:text-amber-400 transition-colors">
                  Blog & Exam Guides
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {currentYear} CrackGov. All rights reserved.</p>
          <p className="text-slate-500">Empowering Government Exam Aspirants Across India.</p>
        </div>
      </div>
    </footer>
  );
}
