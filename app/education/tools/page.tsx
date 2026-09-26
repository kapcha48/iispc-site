import { LegacyArchivePage } from "../../components/LegacyArchivePage";
import { getLegacyPage } from "../../lib/legacy-pages";
import { pageMetadata } from "../../lib/page-metadata";

const page = getLegacyPage("education", "tools")!;

export const metadata = pageMetadata({ title: page.title, description: page.excerpt, path: "/education/tools", image: page.coverUrl, imageAlt: page.title });

export default function EducationToolsPage() {
  return <LegacyArchivePage page={page} sectionTitle="Обучение" sectionHref="/education" />;
}
