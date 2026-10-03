import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans">
      <main className="flex flex-1 w-full flex-col items-center justify-center py-24 px-6 text-center">
        <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Welcome to <span className="text-primary">CrackGov</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          The ultimate platform for external students to access top-tier government exam preparation resources. Connect and access Franchise 1 data directly from here.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/login" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto font-semibold" })}>
            Get Started Now
          </Link>
          <Link href="/courses" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full sm:w-auto font-semibold" })}>
            Browse Courses
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
          <div className="flex flex-col items-center p-6 border rounded-xl bg-card">
            <h3 className="text-xl font-bold mb-2">Comprehensive Materials</h3>
            <p className="text-center text-muted-foreground">Access well-structured notes, previous year question papers, and mock tests designed for success.</p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-xl bg-card">
            <h3 className="text-xl font-bold mb-2">Expert Guidance</h3>
            <p className="text-center text-muted-foreground">Learn from top educators and mentors who have cracked the toughest exams.</p>
          </div>
          <div className="flex flex-col items-center p-6 border rounded-xl bg-card">
            <h3 className="text-xl font-bold mb-2">Franchise Access</h3>
            <p className="text-center text-muted-foreground">Direct access to Franchise 1 data and premium resources for enrolled external students.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
