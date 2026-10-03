import type { Metadata } from "next";
import { CurrentAffairsDirectory } from "@/components/current-affairs/CurrentAffairsDirectory";
import { getPublicCurrentAffairs } from "@/features/current-affairs/api";

export const metadata: Metadata = {
  title: "Daily Current Affairs for Government Exams",
  description: "Read daily current affairs updates with clear context, exam relevance and source links for government exam preparation.",
  keywords: ["daily current affairs", "current affairs for exams", "government exam current affairs", "daily exam updates", "general knowledge"],
  alternates: { canonical: "/current-affairs" },
  openGraph: { type: "website", title: "Daily Current Affairs | CrackGov", description: "Daily updates, exam relevance and source links for your revision.", url: "/current-affairs" },
  twitter: { card: "summary_large_image", title: "Daily Current Affairs | CrackGov", description: "Daily updates and exam-focused revision notes." },
};

export default async function CurrentAffairsPage() {
  const initialData = await getPublicCurrentAffairs({ page: 1, pageSize: 9 }).catch(() => null);
  return <CurrentAffairsDirectory initialData={initialData} />;
}
