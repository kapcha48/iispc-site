import { notFound } from "next/navigation";
import { LegacyArchivePage } from "../../components/LegacyArchivePage";
import { getEditorialLegacyPage } from "../../lib/editorial-pages";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

const page = getEditorialLegacyPage("about", "partners");

export const metadata = page
  ? pageMetadata({ title: page.title, description: page.excerpt, path: "/about/partners", image: page.coverUrl, imageAlt: page.coverAlt || page.title })
  : missingPageMetadata("Страница не найдена");

export default function AboutPartnersPage() {
  if (!page) notFound();
  return <LegacyArchivePage page={page} sectionTitle="О нас" sectionHref="/about" />;
}
