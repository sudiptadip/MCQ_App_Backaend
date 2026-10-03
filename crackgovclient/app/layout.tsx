import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "sonner";
import { siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "CrackGov | Government Exam Preparation & Job Updates",
    template: "%s | CrackGov",
  },
  description: "Prepare for government exams with practice tests and study resources. Explore current government job openings, eligibility, deadlines and official application links on CrackGov.",
  applicationName: "CrackGov",
  keywords: ["government jobs", "government exam preparation", "latest govt jobs", "job notifications", "mock tests", "exam practice", "study materials"],
  authors: [{ name: "CrackGov" }],
  creator: "CrackGov",
  publisher: "CrackGov",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "CrackGov",
    title: "CrackGov | Government Exam Preparation & Job Updates",
    description: "Prepare for government exams and find current public-sector job opportunities on CrackGov.",
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: "CrackGov | Government Exam Preparation & Job Updates",
    description: "Prepare for government exams and discover current job opportunities.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <Header />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            <Footer />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
