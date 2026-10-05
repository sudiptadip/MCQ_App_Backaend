import type { Metadata } from "next";
import { ContactSection } from "@/components/contact/ContactSection";
import { Mail, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | CrackGov",
  description: "Get in touch with the CrackGov team for questions, feedback, academic assistance, or support regarding government exam preparation.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    title: "Contact CrackGov Support",
    description: "Submit an inquiry or reach out to our team for help with mock tests, courses, and government job notifications.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="flex-1">
      {/* Hero Banner */}
      <section className="relative border-b bg-gradient-to-br from-primary/10 via-background to-sky-500/10 py-14 sm:py-20 overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="container mx-auto px-4 text-center max-w-4xl relative">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-xs font-bold text-primary shadow-xs">
            <MessageSquare size={14} /> We'd Love to Hear From You
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl text-foreground">
            Contact CrackGov
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Have questions or feedback? Submit your inquiry using the form below and our team will get back to you promptly.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <ContactSection />
    </main>
  );
}
