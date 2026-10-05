"use client";

import Link from "next/link";
import { Sparkles, Mail, Bell, ArrowRight } from "lucide-react";

export function Topbar() {
  return (
    <div className="w-full bg-slate-900 text-slate-100 text-xs py-2 px-4 dark:bg-slate-950 dark:border-b dark:border-slate-800 transition-colors">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Announcement Ticker */}
        <div className="flex items-center space-x-2 text-center sm:text-left overflow-hidden">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 animate-pulse">
            <Sparkles className="w-3 h-3 text-amber-400" />
            LATEST UPDATE
          </span>
          <span className="truncate text-slate-300">
            SSC CGL, Bank & Railway Mock Tests are Live!
          </span>
          <Link
            href="/jobs"
            className="hidden md:inline-flex items-center gap-0.5 text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 shrink-0 transition-colors"
          >
            Explore Jobs <ArrowRight className="w-3 h-3 ml-0.5 inline" />
          </Link>
        </div>

        {/* Quick Contacts & Links */}
        <div className="hidden sm:flex items-center space-x-5 text-slate-300 shrink-0">
          <div className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <a href="mailto:support@crackgov.com" className="hover:underline">
              support@crackgov.com
            </a>
          </div>
          <span className="text-slate-700 dark:text-slate-700">|</span>
          <Link
            href="/current-affairs"
            className="flex items-center space-x-1 hover:text-amber-300 transition-colors font-medium"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Current Affairs</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
