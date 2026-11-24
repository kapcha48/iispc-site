import { notFound } from "next/navigation";
import { LegacyArchivePage } from "../../components/LegacyArchivePage";
import { getEditorialLegacyPage } from "../../lib/editorial-pages";
import { missingPageMetadata, pageMetadata } from "../../lib/page-metadata";

const page = getEditorialLegacyPage("science", "projects");

export const metadata = page
  ? pageMetadata({ title: page.title, description: page.excerpt, path: "/science/projects", image: page.coverUrl, imageAlt: page.coverAlt || page.title })
  : missingPageMetadata("Страница не найдена");

export default function ScienceProjectsPage() {
  if (!page) notFound();
  return <LegacyArchivePage page={page} sectionTitle="Научная деятельность" sectionHref="/science" />;
}
