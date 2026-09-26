import { LegacyArchivePage } from "../../components/LegacyArchivePage";
import { getLegacyPage } from "../../lib/legacy-pages";
import { pageMetadata } from "../../lib/page-metadata";

const page = getLegacyPage("about", "partners")!;

export const metadata = pageMetadata({
  title: page.title,
  description: page.excerpt,
  path: "/about/partners",
  image: page.coverUrl,
  imageAlt: page.title,
});

export default function AboutPartnersPage() {
  return <LegacyArchivePage page={page} sectionTitle="О нас" sectionHref="/about" />;
}
