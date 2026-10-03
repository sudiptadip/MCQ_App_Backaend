"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "./ui/button";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="CrackGov Logo" className="h-8 w-auto object-contain dark:invert" />
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80">
              Home
            </Link>
            <Link href="/practice" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Practice Modules
            </Link>
            <Link href="/notes" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Notes & PDFs
            </Link>
            <Link href="/videos" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Video Classes
            </Link>
            <Link href="/practice/custom" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Custom Practice
            </Link>
            <Link href="/jobs" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Jobs
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
              About Us
            </Link>
            <Link href="/courses" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Courses
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {!mounted ? (
            <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
          ) : user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-foreground/80">
                Hi, {user.name || "Student"}
              </span>
              <button 
                onClick={handleLogout} 
                className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className={buttonVariants({ variant: "default" })}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
