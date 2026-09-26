import { LegacyArchivePage } from "../../components/LegacyArchivePage";
import { getLegacyPage } from "../../lib/legacy-pages";
import { pageMetadata } from "../../lib/page-metadata";

const page = getLegacyPage("science", "council")!;

export const metadata = pageMetadata({
  title: page.title,
  description: page.excerpt,
  path: "/science/council",
  image: page.coverUrl,
  imageAlt: page.title,
});

export default function ScienceCouncilPage() {
  return <LegacyArchivePage page={page} sectionTitle="Научная деятельность" sectionHref="/science" />;
}
