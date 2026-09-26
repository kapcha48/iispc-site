import Image from "next/image";
import { Breadcrumbs } from "./Breadcrumbs";
import type { LegacyPage } from "../lib/legacy-pages";

export function LegacyArchivePage({ page, sectionTitle, sectionHref }: { page: LegacyPage; sectionTitle: string; sectionHref: string }) {
  const bodyHtml = page.coverUrl
    ? page.html
      .replace(/<img[^>]+src="[^"]+"[^>]*>/i, "")
      .replace(/<a[^>]*>\s*<\/a>/i, "")
    : page.html;

  return (
    <article className="article-page">
      <header className="article-header">
        <div className="shell article-header-inner">
          <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: sectionTitle, href: sectionHref }, { label: page.title }]} />
          <p className="eyebrow">{page.eyebrow} · архив IISPC</p>
          <h1>{page.title}</h1>
          <p className="article-intro">{page.excerpt}</p>
        </div>
      </header>
      {page.coverUrl ? <div className="shell article-cover"><Image src={page.coverUrl} alt="" width={1600} height={900} sizes="(max-width: 1080px) 100vw, 1080px" /></div> : null}
      <div className="shell article-body archive-publication-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <div className="shell article-source"><a className="text-link" href={sectionHref}>Вернуться в раздел <span aria-hidden="true">→</span></a></div>
    </article>
  );
}
