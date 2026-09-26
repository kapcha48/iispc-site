import { LegacyArchivePage } from "../../components/LegacyArchivePage";
import { getLegacyPage } from "../../lib/legacy-pages";
import { pageMetadata } from "../../lib/page-metadata";

const page = getLegacyPage("science", "academy")!;

export const metadata = pageMetadata({ title: page.title, description: page.excerpt, path: "/science/academy", image: page.coverUrl, imageAlt: page.title });

export default function ScienceAcademyPage() {
  return <LegacyArchivePage page={page} sectionTitle="Научная деятельность" sectionHref="/science" />;
}
