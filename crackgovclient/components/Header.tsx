"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "./ui/button";
import {
  Menu,
  X,
  BookOpen,
  GraduationCap,
  Briefcase,
  FileText,
  Video,
  Layers,
  Newspaper,
  Info,
  Home,
  LogOut,
  User,
  ChevronRight,
  HelpCircle,
  Trophy,
  Mail,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/courses", label: "Courses", icon: GraduationCap },
  { href: "/notes", label: "Notes & PDFs", icon: FileText },
  { href: "/videos", label: "Video Classes", icon: Video },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/current-affairs", label: "Current Affairs", icon: Newspaper },
  { href: "/blogs", label: "Blog", icon: FileText },
  { href: "/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/testimonials", label: "Testimonials", icon: Trophy },
  { href: "/contact", label: "Contact Us", icon: Mail },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      } else {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xs transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo & Main Nav */}
        <div className="flex items-center space-x-6 lg:space-x-8">
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <img
              src="/logo.png"
              alt="CrackGov Logo"
              className="h-9 w-auto object-contain dark:invert transition-all"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1 text-sm font-medium">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md transition-all duration-150 ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Tablet Nav (subset of top items) */}
          <nav className="hidden md:flex xl:hidden items-center space-x-1 text-sm font-medium">
            {NAV_ITEMS.slice(0, 6).map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Theme Toggle, User Profile, Mobile Menu Button */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          {!mounted ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <div className="hidden sm:flex items-center space-x-3 bg-accent/40 border border-border px-3 py-1.5 rounded-full">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-foreground max-w-[120px] truncate">
                  {user.name || "Student"}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5 inline" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/98 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {/* User Info on Mobile */}
          {user && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 mb-2 border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {user.name || "Student"}
                  </div>
                  {user.email && (
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-destructive hover:bg-destructive/10 px-2.5 py-1.5 rounded-md transition-colors flex items-center space-x-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* Nav Links List */}
          <nav className="grid gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 opacity-80" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
