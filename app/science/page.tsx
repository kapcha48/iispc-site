import { PageHero } from "../components/PageHero";
import { SectionNav } from "../components/SectionNav";
import { publications } from "../data";
import { listPublishedContent } from "../lib/content-store";
import { pageMetadata } from "../lib/page-metadata";
import { publicationArchive } from "../lib/publication-archive";

export const metadata = pageMetadata({
  title: "Научная деятельность",
  description: "Исследовательские проекты, Международный учёный совет и научные публикации IISPC.",
  path: "/science",
});

export const dynamic = "force-dynamic";

export default async function SciencePage() {
  const managedPublications = await listPublishedContent("publication");
  const managedSlugs = new Set(managedPublications.map((item) => item.slug));
  const archivedPublications = managedPublications.length ? [] : publicationArchive.filter((item) => !managedSlugs.has(item.slug));
  return (
    <>
      <PageHero eyebrow="Наука" title="Научная деятельность IISPC" lead="Международный учёный совет по психотерапии, Международная академия научной психотерапии, научно-исследовательские проекты и публикации." action={{ href: "#science-work", label: "Смотреть разделы" }} />
      <SectionNav items={[{ href: "#science-work", label: "Разделы науки" }, { href: "#science-publications", label: "Публикации" }]} />
      <section className="section science-pillars" id="science-work">
        <div className="shell">
          <div className="section-heading section-heading-editorial"><div><p className="eyebrow">Наука</p><h2>Разделы научной деятельности</h2></div><p>Учёный совет, исследовательские проекты и Международная академия научной психотерапии.</p></div>
          <div className="research-grid research-index">
            <article className="research-card featured"><span>01</span><h3>Международный учёный совет по психотерапии</h3><a className="text-link" href="/science/council">Открыть раздел <span aria-hidden="true">→</span></a></article>
            <article className="research-card"><span>02</span><h3>Научно-исследовательские проекты</h3><a className="text-link" href="/science/projects">Открыть раздел <span aria-hidden="true">→</span></a></article>
            <article className="research-card"><span>03</span><h3>Международная академия научной психотерапии</h3><a className="text-link" href="/science/academy">Открыть раздел <span aria-hidden="true">→</span></a></article>
          </div>
        </div>
      </section>
      <section className="section section-dark science-library" id="science-publications">
        <div className="shell">
          <div className="science-library-intro"><div><p className="eyebrow">Публикации</p><h2>Библиотека научных материалов</h2></div><div><p>Материалы IISPC, сведения об авторах, тематика исследований и доступные файлы публикаций.</p><a className="button button-light" href="/contacts?topic=science#contact-form">Запросить материал <span>→</span></a></div></div>
          <ol className="publication-list publication-list-long science-library-list">
            {managedPublications.map((item, index) => <li key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><a href={`/science/publications/${item.slug}`}>{item.title}</a></li>)}
            {archivedPublications.map((item, index) => <li key={item.slug}><span>{String(managedPublications.length + index + 1).padStart(2, "0")}</span><a href={`/science/publications/${item.slug}`}>{item.title}</a></li>)}
            {!managedPublications.length && !archivedPublications.length ? publications.map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>) : null}
          </ol>
        </div>
      </section>
    </>
  );
}
