import type { Metadata } from "next";
import { CurrentAffairDetailsClient } from "@/components/current-affairs/CurrentAffairDetailsClient";
import { getPublicCurrentAffair } from "@/features/current-affairs/api";
import { siteUrl } from "@/lib/site";
import type { DailyCurrentAffair } from "@/types/current-affairs";
import { safeCurrentAffairsUrl } from "@/features/current-affairs/safeUrl";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicCurrentAffair(slug).catch(() => null);
  const title = item?.metaTitle || item?.pageTitle || item?.title || "Daily Current Affairs";
  const description = item?.metaDescription || item?.excerpt || "Daily current affairs updates and exam revision notes from CrackGov.";
  const canonical = safeCurrentAffairsUrl(item?.canonicalUrl) || new URL(`/current-affairs/${slug}`, siteUrl).toString();
  return {
    title, description,
    keywords: item?.metaKeywords?.split(",").map((word) => word.trim()).filter(Boolean),
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical, publishedTime: item?.publishedOn || undefined, images: safeCurrentAffairsUrl(item?.imageUrl) ? [{ url: safeCurrentAffairsUrl(item?.imageUrl)!, alt: item?.title }] : undefined },
    twitter: { card: safeCurrentAffairsUrl(item?.imageUrl) ? "summary_large_image" : "summary", title, description, images: safeCurrentAffairsUrl(item?.imageUrl) ? [safeCurrentAffairsUrl(item?.imageUrl)!] : undefined },
  };
}

export default async function CurrentAffairDetailsPage({ params }: Props) {
  const { slug } = await params;
  const initialItem = await getPublicCurrentAffair(slug).catch((): DailyCurrentAffair | null => null);
  return <CurrentAffairDetailsClient slug={slug} initialItem={initialItem} />;
}
